sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("hostel.com.hostelmanagement.controller.AdminTile", {
        onInit() {
            let oModel = this.getOwnerComponent().getModel();

            oModel.read("/Rooms", {
                success: (oData) => {
                    // console.log(oData.results);
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
        },
        onTilePressRooms: function () {
            this.getOwnerComponent().getRouter().navTo("RoomsDetails");
        },
        
    });
});