sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageBox, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("hostel.com.hostelmanagement.controller.RoomsDetails", {

        onInit: function () {
            const oView = this.getView();

            oView.setModel(new JSONModel({ tokens: [] }), "tokenModel");
            oView.setModel(new JSONModel({ File: "", FileName: "", FileType: "" }), "UploadModel");
            oView.setModel(new JSONModel({ selectedRoom: {}, busy: false, hasData: false }), "viewModel");
        },

        /** ----------------------------------------------------------------
         *  ROOM LIST MANAGEMENT
         *  ---------------------------------------------------------------- */
        _loadRoomsData: function () {
            const oView = this.getView();
            const oModel = this.getOwnerComponent().getModel();
            const oViewModel = oView.getModel("viewModel");

            if (!oModel) {
                MessageBox.error("OData model not available.");
                return;
            }

            oViewModel.setProperty("/busy", true);

            oModel.read("/Rooms", {
                urlParameters: {
                    "$select": "ID,RoomNo,BedTypes,Price,AC_type,Shareble,Currency,NoOfPersons,BranchCode,CompanyCode,BookingFlag,description,roomPhotos,roomPhotoType"
                },
                success: (oData) => {
                    const rooms = oData.results || [];
                    oViewModel.setProperty("/hasData", rooms.length > 0);
                    MessageToast.show(`Loaded ${rooms.length} rooms`);
                },
                error: (err) => {
                    console.error("Error loading rooms:", err);
                    MessageBox.error("Failed to load rooms.");
                    oViewModel.setProperty("/hasData", false);
                },
                finally: () => oViewModel.setProperty("/busy", false)
            });
        },

        onRefresh: function () {
            this._loadRoomsData();
        },

        onDeleteRoom: function (oEvent) {
            const oRoom = oEvent.getSource().getBindingContext().getObject();
            if (!oRoom?.ID) return;

            MessageBox.confirm(`Delete room ${oRoom.RoomNo}?`, {
                title: "Confirm Deletion",
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        const oModel = this.getOwnerComponent().getModel();
                        oModel.remove(`/Rooms(${oRoom.ID})`, {
                            success: () => {
                                MessageToast.show("Room deleted.");
                                this._loadRoomsData();
                            },
                            error: (err) => MessageBox.error("Delete failed: " + err.message)
                        });
                    }
                }
            });
        },

        formatBoolean: (b) => (b ? "Yes" : "No"),
        formatRoomImage: (photo) => photo?.startsWith("data:") ? photo : "sap-icon://picture",

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
            oView.getModel("viewModel").setProperty("/selectedRoom", oContext.getObject());

            if (!this._oUploadDialog) {
                this._oUploadDialog = await Fragment.load({
                    id: oView.getId(),
                    name: "hostel.com.hostelmanagement.fragments.UploadImage",
                    controller: this
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
                return this._showFileError("Invalid file type. Use JPG, PNG, or GIF.");
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(",")[1];
                this.getView().getModel("UploadModel").setData({
                    File: base64,
                    FileName: oFile.name,
                    FileType: oFile.type
                });

                this.getView().getModel("tokenModel").setProperty("/tokens", [{
                    key: oFile.name,
                    text: oFile.name
                }]);

                this._hideFileError();
                MessageToast.show("File ready: " + oFile.name);
            };
            reader.readAsDataURL(oFile);
        },

        onTokenDelete: function () {
            this.getView().getModel("tokenModel").setProperty("/tokens", []);
            this.getView().getModel("UploadModel").setData({ File: "", FileName: "", FileType: "" });
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
            const oRoom = oView.getModel("viewModel").getProperty("/selectedRoom");

            if (!File) return MessageToast.show("Please select a file first.");
            if (!oRoom?.ID) return MessageToast.show("Room ID missing.");

            try {
                oView.setBusy(true);
                const res = await fetch("/odata/v2/catalog/uploadImage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ID: oRoom.ID,
                        imageData: `data:${FileType};base64,${File}`
                    })
                });

                const text = await res.text();
                MessageToast.show(text);
                this.onCloseUploadDialog();
                this._loadRoomsData();

            } catch (err) {
                console.error("Upload failed:", err);
                MessageBox.error("Upload failed: " + err.message);
            } finally {
                oView.setBusy(false);
            }
        },

        /** ----------------------------------------------------------------
         *  IMAGE VIEWER
         *  ---------------------------------------------------------------- */
        onViewPhoto: async function (oEvent) {
            const sRoomId = oEvent.getSource().getBindingContext().getProperty("ID");
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
                        content: [new sap.m.Image({ width: "100%", densityAware: false })],
                        endButton: new sap.m.Button({
                            text: "Close",
                            press: () => this._oPhotoDialog.close()
                        })
                    });
                    this.getView().addDependent(this._oPhotoDialog);
                }

                this._oPhotoDialog.getContent()[0].setSrc(imageData);
                this._oPhotoDialog.open();
            } catch (err) {
                console.error("Error fetching photo:", err);
                MessageToast.show("Failed to load image.");
            }
        }
    });
});
