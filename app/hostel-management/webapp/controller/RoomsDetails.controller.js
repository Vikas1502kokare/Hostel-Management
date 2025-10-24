sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
  ],
  (Controller, MessageToast, MessageBox, Fragment, JSONModel) => {
    "use strict";

    return Controller.extend(
      "hostel.com.hostelmanagement.controller.RoomsDetails",
      {
        // --- Initialization and Data Fetching ---
        onInit() {
          const oButtonModel = new JSONModel({
            isRoomSelected: false,
          });
          this.getView().setModel(oButtonModel, "viewProperties");

          let oModel = this.getOwnerComponent().getModel();

          oModel.read("/Rooms", {
            success: (oData) => {
              // console.log(oData.results);
              let rooms = oData.results.map((room) => ({
                ...room,
                imageSrc: room.roomPhotos, // already a full data URI
                // imageSrc: room.roomPhotos ? `data:image/jpeg;base64,${room.roomPhotos}` : "",
              }));

              let oJSONModel = new sap.ui.model.json.JSONModel(rooms);
              this.getView().setModel(oJSONModel, "roomsModel");
            },
            error: (error) => {
              console.error("Error fetching Rooms:", error);
            },
          });
        },
        // RoomsDetails.controller.js mein add karein
        onSelectionChange: function (oEvent) {
          const oTable = oEvent.getSource();
          const aSelectedItems = oTable.getSelectedItems();
          const oViewPropsModel = this.getView().getModel("viewProperties");

          // Check karein ki koi item selected hai ya nahi
          const bIsSelected = aSelectedItems.length > 0;
          oViewPropsModel.setProperty("/isRoomSelected", bIsSelected);

          if (bIsSelected) {
            // Selected item ka context save kar sakte hain agar zaroori ho
            this._oSelectedContext =
              aSelectedItems[0].getBindingContext("roomsModel");
          } else {
            this._oSelectedContext = null;
          }
        },

        onAddRooms: function () {
          if (!this._oRoomDialog) {
            this._oRoomDialog = sap.ui.xmlfragment(
              "hostel.com.hostelmanagement.fragments.modRooms",
              this
            );
            this.getView().addDependent(this._oRoomDialog);
          }

          // 💡 FIX: Manually attach the change event
          // Fragment ke andar ke control ko Fragment.byId() se access karein
          const oFileUploader = sap.ui.core.Fragment.byId(
            this._oRoomDialog.getId(),
            "jobFileUploader" // ID changed from 'IDfileUploader' to 'jobFileUploader'
          );

          // Agar control milta hai aur event pehle se attached nahi hai, toh attach karein
          if (oFileUploader && !oFileUploader.hasListeners("change")) {
            // onFileChange function ko attach karein (aapne XML mein bhi 'onFileChange' diya hai)
            oFileUploader.attachChange(this.onFileChange, this);
          }

          const oNewRoomData = {
            mode: "Add Room",
            RoomNo: "",
            BedTypes: "",
            Price: "",
            AC_type: "",
            Shareble: false,
            Currency: "",
            NoOfPersons: 1,
            BranchCode: "",
            CompanyCode: "",
            description: "",
            roomPhotos: null, // Base64 string yahan store hoga
            BookingFlag: false,
          };
          const oRoomModel = new sap.ui.model.json.JSONModel(oNewRoomData);
          this.getView().setModel(oRoomModel, "roomForm");
          this._oRoomDialog.open();
        },

        // 🔹 Open dialog for EDIT mode
        // 🔹 Open dialog for EDIT mode
        onEditRoom: function (oEvent) {
          // 💡 FIX: Table se selected item ko fetch karein
          const oTable = this.getView().byId("roomsTable");
          const aSelectedItems = oTable.getSelectedItems();

          if (aSelectedItems.length === 0) {
            // Agar button selection binding ke bawajood press ho, toh error dein
            MessageBox.error(
              "Kripya Edit karne ke liye ek Room select karein."
            );
            return;
          }

          // SingleSelectMaster mode mein, sirf pehla item uthana hai
          const oSelectedRoom = aSelectedItems[0]
            .getBindingContext("roomsModel")
            .getObject();

          if (!this._oRoomDialog) {
            this._oRoomDialog = sap.ui.xmlfragment(
              "hostel.com.hostelmanagement.fragments.modRooms",
              this
            );
            this.getView().addDependent(this._oRoomDialog);
          }

          const oRoomData = { ...oSelectedRoom, mode: "Edit Room" };
          const oRoomModel = new sap.ui.model.json.JSONModel(oRoomData);
          this.getView().setModel(oRoomModel, "roomForm");

          this._oRoomDialog.open();

          // 💡 BEST PRACTICE: Dialog open hone ke baad selection clear kar dein (optional)
          // oTable.removeSelections(true);
          // this.getView().getModel("viewProperties").setProperty("/isRoomSelected", false);
        },

        onFileChange: function (oEvent) {
          const oFileUploader = oEvent.getSource();
          const aFiles = oEvent.getParameter("files");

          if (aFiles && aFiles.length > 0) {
            const oFile = aFiles[0];
            const oReader = new FileReader();
            const oRoomFormModel = this.getView().getModel("roomForm");

            // File ko Data URL (Base64) mein read karein
            oReader.readAsDataURL(oFile);

            oReader.onload = (e) => {
              const sResult = e.target.result;

              oRoomFormModel.setProperty("/roomPhotos", sResult);

              oRoomFormModel.setProperty("/imageSrc", sResult);

              sap.m.MessageToast.show(oFile.name + " selected and converted.");
            };

            oReader.onerror = (e) => {
              sap.m.MessageBox.error(
                "File reading mein error: " + e.target.error.name
              );
              oRoomFormModel.setProperty("/roomPhotos", null);
              oRoomFormModel.setProperty("/imageSrc", "");
            };
          } else {
            // Agar file clear ho gayi hai
            this.getView()
              .getModel("roomForm")
              .setProperty("/roomPhotos", null);
            this.getView().getModel("roomForm").setProperty("/imageSrc", "");
          }
        },

        onSaveRoom: async function () {
          const oModel = this.getOwnerComponent().getModel();
          const oData = this.getView().getModel("roomForm").getData();
          const oDialog = this._oRoomDialog;
          const bIsEdit = oData.mode === "Edit Room";

          // ⚠️ Validation: Check agar roomPhotos null hai 'Add' mode mein
          if (!bIsEdit && !oData.roomPhotos) {
            sap.m.MessageBox.error("Kripya room image upload karein!");
            return; // Stop processing
          }

          this.getView().setBusy(true);

          try {
            // --- Sanitize Payload ---
            const oPayload = { ...oData };
            delete oPayload.mode;
            delete oPayload.imageSrc; // derived property, isko OData mein nahi bhejna hai

            // roomPhotos Base64 string ab payload mein hai
            // yahan koi aur change karne ki zaroorat nahi hai.

            // 🔹 DEBUG: Print the payload
            console.log("😍Payload being sent to OData:", oPayload);

            // --- CREATE or UPDATE ---
            if (bIsEdit) {
              await new Promise((resolve, reject) => {
                oModel.update(`/Rooms('${oPayload.ID}')`, oPayload, {
                  success: () => {
                    sap.m.MessageToast.show("Room updated successfully!");
                    resolve();
                  },
                  error: (err) => {
                    console.error(err);
                    sap.m.MessageBox.error("Error updating room!");
                    reject(err);
                  },
                });
              });
            } else {
              await new Promise((resolve, reject) => {
                oModel.create("/Rooms", oPayload, {
                  success: () => {
                    sap.m.MessageToast.show("Room created successfully!");
                    resolve();
                  },
                  error: (err) => {
                    console.error(err);
                    sap.m.MessageBox.error("Error creating room!");
                    reject(err);
                  },
                });
              });
            }

            oModel.refresh(true);
            oDialog.close();
          } catch (err) {
            console.error("Error saving room:", err);
          } finally {
            this.getView().setBusy(false);
          }
        },

        // ... onCancelRoom function ...
        onCancelRoom: function () {
          // Check karein ki dialog exist karta hai aur close karein
          if (this._oRoomDialog) {
            // Agar yeh ek control hai, toh seedha close() call karein.
            this._oRoomDialog.close();

            // Optional: Agar aap dialog ko destroy karna chahte hain:
            // this._oRoomDialog.destroy();
            // this._oRoomDialog = null;
          } else {
            // Agar dialog abhi tak open nahi hua tha ya initialize nahi hua tha
            console.warn("Room Dialog is not initialized or open.");
          }
        },
      }
    );
  }
);
