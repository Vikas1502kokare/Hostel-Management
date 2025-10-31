sap.ui.define([], function () {
  "use strict";
  return {
    getRoomImage: function (sMediaSrc) {
      if (sMediaSrc) {
        return sMediaSrc + "?t=" + Date.now(); // backend image
      }
      // fallback
      const sFallback = sap.ui.require.toUrl("hostel/com/hostelmanagement/images/no-image.png");
      console.log("Using fallback image:", sFallback);
      return sFallback;
    },
formatCurrencySymbol: function (sLabel, sValue, sCurrency) {
  if (!sValue) return sLabel + " —";

  const oCurrencyType = new sap.ui.model.type.Currency({
    showMeasure: true,
    currencyCode: false, // 👈 show symbol (€ instead of EUR)
    maxFractionDigits: 2
  });

  const sFormatted = oCurrencyType.formatValue([sValue, sCurrency], "string");
  return `${sLabel}${sFormatted}`;
},


  };
});
