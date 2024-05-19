$(function () {
  const hash = window.location.hash;
  let toShow = "#step-" + (hash ? hash.replace("#", "") : "form");
  $(toShow).removeClass("hidden");

  let demoUrl = localStorage.getItem("idcfDemoUrl");
  if (demoUrl) {
    $("form")[0].action = demoUrl;
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
      if (!$('#card-holder').val()) {
        $('#card-holder').val("John Doe");
      }
      if (!$('#card-exp').val()) {
        $('#card-exp').val("06/" + ("" + (new Date().getFullYear() + 1)).substring(2));
      }
      if (!$('#card-cvc').val()) {
        $('#card-cvc').val("123");
      }
    }
  });
  
  $("#pay").on('click', async function(){
    if (validateCardNum()) {
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

});
