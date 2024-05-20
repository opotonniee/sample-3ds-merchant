const LOCAL_STORAGE = "idcf3dsRemember";

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

  let demoUrl = localStorage.getItem("idcfDemoUrl");
  if (demoUrl) {
    $("form")[0].action = demoUrl + "/3ds";
    $("#idcf-demo-link a").attr("href", demoUrl);
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

  $("#pay").on('click', async function() {
    if (validateCardNum()) {
      if ($("#card-remember")[0].checked) {
        const remember = {
          pan: $('#card-number').val(),
          holder: $('#card-holder').val().trim()
        }
        localStorage.setItem(LOCAL_STORAGE, JSON.stringify(remember));
      } else {
        localStorage.removeItem(LOCAL_STORAGE);
      }
      const transactionData = {
        "acctNumber": panVal,
        "notificationURL": window.location.toString(),
        "threeDSRequestorURL": window.location.toString(),
        "cardExpiryDate":  $('#card-exp').val(),
        "cardholderName": $('#card-holder').val(),
        "merchantName": "Your Sport Shop",
        "purchaseAmount": "435.55",
        "purchaseCurrency": "USD",
        "purchaseDate": Number(new Date().getTime()).toString()
      };
      $("#form-transaction").val(JSON.stringify(transactionData));
      $("#form-submit").trigger("click");
    }
  });

  let stored = localStorage.getItem(LOCAL_STORAGE);
  if (stored) {
    stored = JSON.parse(stored);
    panInput.val(stored.pan);
    $('#card-holder').val(stored.holder);
    $("#card-remember")[0].checked = true;
  }

});
