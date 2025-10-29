sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "hostel/com/hostelmanagement/model/formatter"
], function (Controller, MessageToast,formatter) {
  "use strict";

  return Controller.extend("hostel.com.hostelmanagement.controller.View1", {
    formatter: formatter,


  onInit: function () {
    const oModel = this.getOwnerComponent().getModel();
    this.getView().setModel(oModel);
  },
onImageError: function (oEvent) {
  const oImage = oEvent.getSource();
  const sFallback = sap.ui.require.toUrl("hostel/com/hostelmanagement/images/no-image.png");
  console.warn("Image failed to load, switching to fallback:", sFallback);
  oImage.setSrc(sFallback);
},



onViewDetails: function (oEvent) {
  const oContext = oEvent.getSource().getBindingContext();
  const oRoom = oContext.getObject();
  sap.m.MessageToast.show(`Selected Room: ${oRoom.RoomNo}`);
},


    onAfterRendering: function () {
      this.startAutoSlide();
    },
getNoImage: function () {
  return sap.ui.require.toUrl("hostel/com/hostelmanagement/images/no-image.png");
},



    startAutoSlide: function () {
      var that = this;

      // Clear previous interval
      if (this.autoSlideInterval) {
        clearInterval(this.autoSlideInterval);
      }

      // Start auto slide
      this.autoSlideInterval = setInterval(function () {
        var oCarousel = that.getView().byId("myCarousel");
        if (oCarousel) {
          // Force carousel to next slide
          oCarousel.next();
        }
      }, 2000);
    },


    

    OnAdminTile: function (oEvent) {
      this.getOwnerComponent().getRouter().navTo("AdminTile");
    },

    LoginPage: function () {
      this.getOwnerComponent().getRouter().navTo("Login");
    },
 
    onNavigateToBooking: function(){
      this.getOwnerComponent().getRouter().navTo("BookingPage");
    },
    
  });
});
