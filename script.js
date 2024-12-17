const LOCAL_STORAGE = "idcf3ds";
const storage = localStorage.getItem(LOCAL_STORAGE);
const config = storage ? JSON.parse(storage) : {};

$(function () {
  const hash = window.location.hash;
  let toShow = "#step-" + (hash ? hash.replace("#", "") : "form");
  $(toShow).removeClass("hidden");

  if (hash) {
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: "smooth",
      });
    }, 100);
  }

  if (config?.demoUrl) {
    $("form")[0].action = config.demoUrl + "/3ds";
    $("#idcf-demo-link a").attr("href", config.demoUrl);
  }

  let panInput = $('#card-number');
  let panVal;

  function readCard() {
    panVal = panInput.val();
    panVal = panVal.replaceAll(/[ -]/g, "");
  }

  function validateCardNum() {
    readCard();
    if (! /^\d{16}$/.exec(panVal)) {
      alert("Invalid card number");
      panInput[0].focus();
      return false;
    } else {
      return true;
    }
  }

  panInput.on("focusout", () => {
    readCard();
    if (panVal) {
      if (!$('#card-exp').val()) {
        $('#card-exp').val("06/" + ("" + (new Date().getFullYear() + 1)).substring(2));
      }
      if (!$('#card-cvc').val()) {
        $('#card-cvc').val("123");
      }
    }
  });

  $("#pay").on('click', async function () {
    if (validateCardNum()) {
      if ($("#card-remember")[0].checked) {
        config.remember = {
          pan: $('#card-number').val().trim(),
          holder: $('#card-holder').val().trim()
        };
      } else {
        delete config.remember;
      }
      localStorage.setItem(LOCAL_STORAGE, JSON.stringify(config));
      const transactionData = {
        acctNumber: panVal,
        notificationURL: window.location.toString(),
        threeDSRequestorURL: window.location.toString(),
        cardExpiryDate: $('#card-exp').val(),
        cardholderName: $('#card-holder').val(),
        merchantName: "Your Sport Shop",
        purchaseAmount: "435.55",
        purchaseCurrency: "USD",
        purchaseDate: Number(new Date().getTime()).toString()
      };
      if (!config.useSPC) {
        $("#form-transaction").val(JSON.stringify(transactionData));
        $("#form-submit").trigger("click");
      } else {
        try {
          const optionsRes = await fetch(config.demoUrl + "/spc/options", {
            method: 'POST',
            mode: 'cors',
            headers: new Headers([[
              "Content-Type", "application/json"
            ]]),
            body: JSON.stringify({
              pan: panVal
            })
          });
          let webauthnOptions = await optionsRes.json();
          webauthnOptions.extensions.payment = {
            isPayment: true,
            rpId: new URL(config.demoUrl).hostname,
            topOrigin: "https://" + location.hostname,
            payeeName: transactionData.merchantName,
            payeeOrigin: "https://" + location.hostname,
            total: {
              currency: transactionData.purchaseCurrency,
              value: transactionData.purchaseAmount,
            },
            instrument: {
              displayName: "Card **** " + panVal.slice(-4),
              icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAQCAYAAAAMJL+VAAAACXBIWXMAAACxAAAAsQHGLUmNAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAvJJREFUOI11lMtu5FQQhj+fc9ydZATkPkQzmeeAQQKx5AV4AZ4JiRcYiQ0L9qyQgB2gDBoxkJAQSOfSCbm1+2K76mdhdydphoV17HKduvxV/599/sU331ZV+RwRhQCQBAIhJACRZYEQAmaGWT2zS2r9m9vTb0l2dHT0Q6qr6vnJ8UmUhLvPHKbv0zPPu4QQGY0GVFWJu+MuXN74uLc2n9ri6dn5+wmIktjaegwEbm4Lri4v7ioDJAgx4OZUdXWvyiaw1ASV/H4HIGKaQnJ8fAqAmT1wkkRKOXKoqhK58Ln/s67nkkoiId4IyTRxCImUctyNshzPBWsfn0/S2EDMOvjsk3224l/o9h9+/angy4tPyfMuMSbcnfGowN3mYHmYZOnRIpubG3Q6C7zceQmCFFOi211kffGK7vUFdnXGGgUL3SVcws0YjQoqqx9C4prD3tl++oSFxUe89fYq0g6CBqIQIns7N6zXN6iYcFhs4mown0xGzVzehL3fweISv73eZWVtjZT6SN5AVNUlo3HBV7sfI8BlWG1U1XVTod9VOE3yf0Muq4qTXq/tquFQQmB1Td7JwbzZSUQWAjFE3IzaDLKMEJoC3DPMMmIMQMa4nNDNu4QsQMgQzrAYEUJBUsvGDz96j37/hmJQEmKHi4tT1jeWGY+NkDrg4vqyj5mzvLqOmVNVY1aWlzg8PGNldQNRsvzOImurS7x48TXA3Rb9/OMvVLVRljXmRjkeMxxcMZlUWDtscMyMs7NjyKDTWeC8H7m8vOa8f4xUE2NGljmj4Q1m9V2C09P+A6rLncHgdo7+Qu4NfKlLMRi2izDEzWaycV9yklqibb37mJSnNrhwHFqtUXua1RwcHBFjjssoJ2PKasL2s6d08pw/Dw7ZfvaE8WTC7u97DUSSTFI86vUa8XooWA9ELKaclDoNq0fDVpecg/2Dmc+rV69xN9wdkKW/e73v9v7Y/0BS/I/kTpVOIgsRyFDbSRtgto6ileyZSMrc9f2/Mc5XutMXjh8AAAAASUVORK5CYII=",
            }
          };
          if (config?.spcCredId) {
            // force credential to use
            webauthnOptions.allowCredentials = [{
              id: config.spcCredId,
              type: "public-key"
            }];
          }
          let idcloud = new IdCloud({
            fido: {
              usePlatformFIDO: true,
              useRoamingFIDO: false
            }
          });
          let assertion = await idcloud.authenticate(webauthnOptions);

          const resultRes = await fetch(config.demoUrl + "/spc/result", {
            method: 'POST',
            mode: 'cors',
            headers: new Headers([[
              "Content-Type", "application/json"
            ]]),
            body: JSON.stringify(assertion)
          });
          let webauthnResult = await resultRes.json();
          location.href = (webauthnResult.result == "ok") ? "/?#success" : "/?#failed";
        } catch (error) {
          alert("ERROR: " + error);
          console.error(error);
        }
      }
    }
  });

  if (config?.remember?.pan) {
    panInput.val(config.remember.pan);
    $('#card-holder').val(config.remember?.holder);
    $("#card-remember")[0].checked = true;
  }

});
