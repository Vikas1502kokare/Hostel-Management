

sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("hostel.com.hostelmanagement.controller.View1", {
        onInit() {
            let oModel = this.getOwnerComponent().getModel();

            oModel.read("/Rooms", {
                success: (oData) => {
                    console.log(oData.results);
                    let rooms = oData.results.map(room => ({
                        ...room,
                        imageSrc: room.roomPhotos   // already a full data URI
                    }));

                    let oJSONModel = new sap.ui.model.json.JSONModel(rooms);
                    this.getView().setModel(oJSONModel, "roomsModel");
                },
                error: (error) => {
                    console.error("Error fetching Rooms:", error);
                }
            });
            this.autoSlideInterval = null;
        },
        onNavigateToBooking: function () {
            this.getOwnerComponent().getRouter().navTo("BookingPage");
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
        }
    });
});