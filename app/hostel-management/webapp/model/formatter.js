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
    }
  };
});
