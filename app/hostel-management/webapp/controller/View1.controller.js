sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/Panel",
  "sap/m/VBox",
  "sap/m/HBox",
  "sap/m/Image",
  "sap/m/Text",
  "sap/m/ObjectStatus",
  "sap/m/Button",
  "sap/m/MessageToast"
], function (Controller, Panel, VBox, HBox, Image, Text, ObjectStatus, Button, MessageToast) {
  "use strict";

  return Controller.extend("hostel.com.hostelmanagement.controller.View1", {




        onInit: function () {
      this._loadRoomsShowcase();
    },

    onAfterRendering: function () {
      this.startAutoSlide();
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
    _loadRoomsShowcase: function () {
      const oModel = this.getOwnerComponent().getModel();
      const oContainer = this.byId("roomsContainer");

      oModel.read("/Rooms", {
        success: (oData) => {
          oData.results.forEach(room => {
            const oPanel = new sap.m.Panel({
              headerText: room.RoomNo ? `Room ${room.RoomNo}` : "Room",
              width: "480px",
              expandable: false,
              content: [
                new VBox({
                  items: [
                    new Image({
                      src: room.__metadata?.media_src ?   
                        room.__metadata.media_src + "?t=" + Date.now() : 
                        "sap-icon://picture" ,
                      width: "100%",
                      height: "160px",
                      densityAware: false,
                      decorative: false
                    }),
                    new Text({ text: `Price: ₹${room.Price}` }).addStyleClass("sapUiTinyMarginTop"),
                    new Text({ text: `Type: ${room.AC_type}` }),
                    new Text({ text: `Beds: ${room.BedTypes}` }),
                    new Text({ text: `Description: ${room.description || "N/A"}` }),
                    new ObjectStatus({
                      text: room.BookingFlag ? "Booked" : "Available",
                      state: room.BookingFlag ? "Error" : "Success"
                    }),
                    new Button({
                      text: "View Details",
                      type: "Emphasized",
                      press: () => this._onViewDetails(room)
                    }).addStyleClass("sapUiTinyMarginTop")
                  ]
                }).addStyleClass("sapUiSmallMargin")
              ]
            }).addStyleClass("sapUiTinyMargin sapUiNoContentPadding");

            oContainer.addItem(oPanel);
          });
        },
        error: () => {
          MessageToast.show("Failed to load rooms.");
        }
      });
    },

    _onViewDetails: function (room) {
      MessageToast.show(`Selected Room: ${room.RoomNo}`);
      // optionally navigate to details or open a dialog
    },
    SeeDetails: function (oEvent) {
      this.getOwnerComponent().getRouter().navTo("BookingPage");
    },
    OnAdminTile: function (oEvent) {
      this.getOwnerComponent().getRouter().navTo("AdminTile");
    },

    LoginPage: function () {
      this.getOwnerComponent().getRouter().navTo("Login");
    },
    SigninPage: function () {
      this.getOwnerComponent().getRouter().navTo("Login");
    },
    onNavigateToBooking: function(){
      this.getOwnerComponent().getRouter().navTo("BookingPage");
    },
    
  });
});
