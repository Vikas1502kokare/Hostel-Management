sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  function (Controller, JSONModel, MessageBox, MessageToast, Fragment) {
    "use strict";

    return Controller.extend(
      "hostel.com.hostelmanagement.controller.RoomsDetails",
      {
        onInit: function () {
          const oView = this.getView();

          oView.setModel(new JSONModel({ tokens: [] }), "tokenModel");
          oView.setModel(
            new JSONModel({ File: "", FileName: "", FileType: "" }),
            "UploadModel"
          );
          oView.setModel(
            new JSONModel({ selectedRoom: {}, busy: false, hasData: false }),
            "viewModel"
          );
        },

        onRoomSelect: function (oEvent) {
          const oTable = oEvent.getSource();
          const oSelectedItem = oTable.getSelectedItem();
          const bHasSelection = !!oSelectedItem;

          // Enable or disable Edit/Delete based on selection
          this.byId("btnEditRoom").setEnabled(bHasSelection);
          this.byId("btnDeleteRoom").setEnabled(bHasSelection);

          // Store selected room in viewModel
          const oRoom = oSelectedItem
            ? oSelectedItem.getBindingContext().getObject()
            : null;
          this.getView()
            .getModel("viewModel")
            .setProperty("/selectedRoom", oRoom);
        },

        /** ----------------------------------------------------------------
         *  ROOM LIST MANAGEMENT
         *  ---------------------------------------------------------------- */

        _loadRoomsData: function () {
          const oView = this.getView();
          const oModel = this.getOwnerComponent().getModel();
          const oViewModel = oView.getModel("viewModel");
          const oTable = this.byId("roomsTable");

          if (!oModel) {
            MessageBox.error("OData model not available.");
            return;
          }

          oViewModel.setProperty("/busy", true);

          // 🔹 Force refresh of backend data
          oModel.refresh(true);

          // 🔹 Also refresh binding explicitly (ensures UI refresh)
          const oBinding = oTable.getBinding("items");
          if (oBinding) {
            oBinding.refresh();
          }

          // 🔹 Reset UI state
          oTable.removeSelections(true);
          this.byId("btnEditRoom").setEnabled(false);
          this.byId("btnDeleteRoom").setEnabled(false);
          oViewModel.setProperty("/selectedRoom", null);

          oViewModel.setProperty("/busy", false);
        },

        onEditRoom: function () {
          const oRoom = this.getView()
            .getModel("viewModel")
            .getProperty("/selectedRoom");
          if (!oRoom) return MessageToast.show("Please select a room first.");
          // your existing edit dialog logic here
        },

        onDeleteRoom: function () {
          const oRoom = this.getView()
            .getModel("viewModel")
            .getProperty("/selectedRoom");
          if (!oRoom?.ID)
            return MessageToast.show("Please select a room first.");

          MessageBox.confirm(`Delete room ${oRoom.RoomNo}?`, {
            title: "Confirm Deletion",
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                const oModel = this.getOwnerComponent().getModel();
                oModel.remove(`/Rooms(${oRoom.ID})`, {
                  success: () => {
                    MessageToast.show("Room deleted.");
                    this._loadRoomsData();
                    this.byId("btnEditRoom").setEnabled(false);
                    this.byId("btnDeleteRoom").setEnabled(false);
                  },
                  error: (err) =>
                    MessageBox.error("Delete failed: " + err.message),
                });
              }
            },
          });
        },

        formatBoolean: (b) => (b ? "Yes" : "No"),
        formatRoomImage: (photo) =>
          photo?.startsWith("data:") ? photo : "sap-icon://picture",

        onBack: function () {
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter ? oRouter.navTo("AdminTile") : window.history.back();
        },

        /** ----------------------------------------------------------------
         *  IMAGE UPLOAD DIALOG
         *  ---------------------------------------------------------------- */
        onOpenUploadDialog: async function (oEvent) {
          const oView = this.getView();
          const oContext = oEvent.getSource().getBindingContext();
          oView
            .getModel("viewModel")
            .setProperty("/selectedRoom", oContext.getObject());

          if (!this._oUploadDialog) {
            this._oUploadDialog = await Fragment.load({
              id: oView.getId(),
              name: "hostel.com.hostelmanagement.fragments.UploadImage",
              controller: this,
            });
            oView.addDependent(this._oUploadDialog);
          }

          // Reset controls
          this.byId("roomTokenizer")?.removeAllTokens();
          this.byId("roomFileUploader")?.clear();
          this.byId("MS-fileErrorText")?.setVisible(false);

          this._oUploadDialog.open();
        },

        onCloseUploadDialog: function () {
          if (this._oUploadDialog) {
            this._oUploadDialog.close();
            setTimeout(() => {
              this._oUploadDialog.destroy(true);
              this._oUploadDialog = null;
            }, 300);
          }
        },

        /** ----------------------------------------------------------------
         *  FILE HANDLING
         *  ---------------------------------------------------------------- */
        onFileChange: function (oEvent) {
          const oFile = oEvent.getParameter("files")[0];
          if (!oFile) return MessageToast.show("No file selected");

          if (oFile.size > 5 * 1024 * 1024) {
            return this._showFileError("File size must be under 5 MB.");
          }

          const allowed = ["image/jpeg", "image/png", "image/gif"];
          if (!allowed.includes(oFile.type)) {
            return this._showFileError(
              "Invalid file type. Use JPG, PNG, or GIF."
            );
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target.result.split(",")[1];
            this.getView().getModel("UploadModel").setData({
              File: base64,
              FileName: oFile.name,
              FileType: oFile.type,
            });

            this.getView()
              .getModel("tokenModel")
              .setProperty("/tokens", [
                {
                  key: oFile.name,
                  text: oFile.name,
                },
              ]);

            this._hideFileError();
            MessageToast.show("File ready: " + oFile.name);
          };
          reader.readAsDataURL(oFile);
        },

        onTokenDelete: function () {
          this.getView().getModel("tokenModel").setProperty("/tokens", []);
          this.getView()
            .getModel("UploadModel")
            .setData({ File: "", FileName: "", FileType: "" });
        },

        _showFileError: function (msg) {
          const layout = this.byId("fileErrorLayout");
          const strip = this.byId("MS-fileErrorText");
          strip.setText(msg);
          strip.setVisible(true);
          layout.setVisible(true);
        },

        _hideFileError: function () {
          const layout = this.byId("fileErrorLayout");
          const strip = this.byId("MS-fileErrorText");
          strip.setVisible(false);
          layout.setVisible(false);
        },

        /** ----------------------------------------------------------------
         *  IMAGE UPLOAD REQUEST
         *  ---------------------------------------------------------------- */
        onUploadImageSubmit: async function () {
          const oView = this.getView();
          const { File, FileType } = oView.getModel("UploadModel").getData();
          const oRoom = oView
            .getModel("viewModel")
            .getProperty("/selectedRoom");

          if (!File) return MessageToast.show("Please select a file first.");
          if (!oRoom?.ID) return MessageToast.show("Room ID missing.");

          try {
            oView.setBusy(true);
            const res = await fetch("/odata/v2/catalog/uploadImage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ID: oRoom.ID,
                imageData: `data:${FileType};base64,${File}`,
              }),
            });

            const result = await res.json();
            const message =
              result?.d?.uploadImage || "Image uploaded successfully.";
            MessageToast.show(message);

            this.onCloseUploadDialog();
            oView.setBusy(true);
            await new Promise((r) => setTimeout(r, 500)); // simulate delay
            const oModel = this.getOwnerComponent().getModel();
            oModel.refresh(true);
            oView.setBusy(false);

            // 🔹 Force re-read from backend
            this._loadRoomsData();
          } catch (err) {
            console.error("Upload failed:", err);
            MessageBox.error("Upload failed: " + err.message);
          } finally {
            oView.setBusy(false);
          }
        },

        cacheBustImage: function (sUrl) {
          if (!sUrl) return "sap-icon://picture";
          return sUrl + "?t=" + new Date().getTime(); // add timestamp to bust cache
        },

        /** ----------------------------------------------------------------
         *  IMAGE VIEWER
         *  ---------------------------------------------------------------- */
        onViewPhoto: async function (oEvent) {
          const sRoomId = oEvent
            .getSource()
            .getBindingContext()
            .getProperty("ID");
          const sUrl = `/odata/v2/catalog/getRoomPhoto?ID=${sRoomId}`;

          try {
            const response = await fetch(sUrl);
            const result = await response.json();
            const imageData = result?.d?.getRoomPhoto;

            if (!imageData?.startsWith("data:image")) {
              return MessageToast.show("No image available.");
            }

            if (!this._oPhotoDialog) {
              this._oPhotoDialog = new sap.m.Dialog({
                title: "Room Photo",
                contentWidth: "50%",
                content: [
                  new sap.m.Image({ width: "100%", densityAware: false }),
                ],
                endButton: new sap.m.Button({
                  text: "Close",
                  press: () => this._oPhotoDialog.close(),
                }),
              });
              this.getView().addDependent(this._oPhotoDialog);
            }

            this._oPhotoDialog.getContent()[0].setSrc(imageData);
            this._oPhotoDialog.open();
          } catch (err) {
            console.error("Error fetching photo:", err);
            MessageToast.show("Failed to load image.");
          }
        },
      }
    );
  }
);
