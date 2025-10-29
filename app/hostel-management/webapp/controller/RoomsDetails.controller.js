sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  "hostel/com/hostelmanagement/model/formatter"
    
  ],
  function (Controller, JSONModel, MessageBox, MessageToast, Fragment, formatter) {
    "use strict";

    return Controller.extend(
      "hostel.com.hostelmanagement.controller.RoomsDetails",
      {
        formatter: formatter,
        onInit: function () {
          const oView = this.getView();

          // View Models define karein
          oView.setModel(new JSONModel({ tokens: [] }), "tokenModel");
          oView.setModel(
            new JSONModel({ File: "", FileName: "", FileType: "" }),
            "UploadModel"
          );
          oView.setModel(
            new JSONModel({ selectedRoom: {}, busy: false, hasData: false }),
            "viewModel"
          );

          // 🔹 'local' model ko empty define karein
          oView.setModel(new JSONModel({ CompanyCodes: [] }), "local");

          // 🔹 Backend se Company Codes fetch karein
          this._fetchUniqueCompanyCodes();
        },



        
        // -------------------------------------------------------------
        // 🔹 Naya Private Function: Unique Codes Fetch karna
        // -------------------------------------------------------------
        _fetchUniqueCompanyCodes: function () {
          const oModel = this.getOwnerComponent().getModel(); // Aapka OData Model
          const oLocalModel = this.getView().getModel("local");
          const sEntitySet = "/Rooms"; // Entity Set jismein Company Code hai

          if (!oModel) {
            console.error("OData model is not available.");
            return;
          }

          // 💡 Best Practice: Sirf zaroori field select karein ($select)
          // Distinct values ke liye koi standard OData V2 operator nahi hai,
          // isliye hum saara data fetch karke client-side par filter karenge.

          oModel.read(sEntitySet, {
            // Sirf CompanyCode field laane ki koshish (performance ke liye)
            urlParameters: {
              $select: "CompanyCode",
            },
            success: (oData) => {
              // Data milne par
              const aResults = oData.results;

              // 1. Unique Company Codes ka Set banayein
              const aUniqueCodes = [
                ...new Set(aResults.map((item) => item.CompanyCode)),
              ];

              // 2. ComboBox ke format mein object array banayein
              const aFormattedCodes = aUniqueCodes.map((code) => ({
                CompanyCode: code, // Property name wahi rakhein jo XML mein use kiya hai
              }));

              // 3. 'local' model mein set karein, jisse ComboBox update ho jaye
              oLocalModel.setProperty("/CompanyCodes", aFormattedCodes);

              MessageToast.show(
                `Fetched ${aFormattedCodes.length} unique Company Codes.`
              );
            },
            error: (oError) => {
              MessageBox.error(
                "Company Codes fetch nahi ho paye: " + oError.responseText
              );
              console.error("Read failed:", oError);
            },
          });
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
          const oFile = oEvent.getParameter("files")?.[0];
          if (!oFile) {
            MessageToast.show("No file selected");
            return;
          }

          // File validation
          const MAX_SIZE_MB = 5;
          const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

          if (oFile.size > MAX_SIZE_MB * 1024 * 1024) {
            return this._showFileError(
              `File size must be under ${MAX_SIZE_MB} MB.`
            );
          }

          if (!ALLOWED_TYPES.includes(oFile.type)) {
            return this._showFileError(
              "Invalid file type. Use JPG, PNG, or GIF."
            );
          }

          // Read file as Base64
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const base64 = e.target.result.split(",")[1];
              const oUploadModel = this.getView().getModel("UploadModel");
              const oTokenModel = this.getView().getModel("tokenModel");

              oUploadModel.setData({
                File: base64,
                FileName: oFile.name,
                FileType: oFile.type,
              });

              oTokenModel.setProperty("/tokens", [
                { key: oFile.name, text: oFile.name },
              ]);

              this._hideFileError();
              MessageToast.show(`File ready: ${oFile.name}`);
            } catch (err) {
              this._showFileError("Error processing file. Please try again.");
              console.error("File reading error:", err);
            }
          };

          reader.onerror = () => {
            this._showFileError("Failed to read file. Please retry.");
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

cacheBustImage: function (sMediaSrc) {
  if (sMediaSrc) {
    return sMediaSrc + "?t=" + Date.now(); // Backend image
  }
  // Local fallback if no backend URL
  return sap.ui.require.toUrl("hostel/com/hostelmanagement/images/no-image.png");
},

onImageError: function (oEvent) {
  const sFallback = sap.ui.require.toUrl("hostel/com/hostelmanagement/images/no-image.png");
  console.warn("Image failed, using fallback:", sFallback);
  oEvent.getSource().setSrc(sFallback);
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
                contentWidth: "75%",
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

        /////////////////////////////////////////////////////////////////////
        onAddRoom: async function () {
          const oView = this.getView();
          const oVM = oView.getModel("viewModel");

          oVM.setProperty("/dialogTitle", "Add Room");
          oVM.setProperty("/formData", {
            CompanyCode: "",
            BranchCode: "",
            RoomNo: "",
            AC_type: "",
            BedTypes: "",
            Price: "",
            NoOfPersons: 1,
            Shareble: false,
            BookingFlag: false,
            description: "",
            File: "",
            FileType: "",
          });

          if (!this._oAddEditDialog) {
            this._oAddEditDialog = await Fragment.load({
              id: oView.getId(),
              name: "hostel.com.hostelmanagement.fragments.AddEditRoom",
              controller: this,
            });
            oView.addDependent(this._oAddEditDialog);
          }

          this._oAddEditDialog.open();
        },

        onEditRoom: async function () {
          const oRoom = this.getView()
            .getModel("viewModel")
            .getProperty("/selectedRoom");
          if (!oRoom) return MessageToast.show("Please select a room first.");

          const oView = this.getView();
          const oVM = oView.getModel("viewModel");

          oVM.setProperty("/dialogTitle", "Edit Room");
          oVM.setProperty("/formData", { ...oRoom, File: "", FileType: "" });

          if (!this._oAddEditDialog) {
            this._oAddEditDialog = await Fragment.load({
              id: oView.getId(),
              name: "hostel.com.hostelmanagement.fragments.AddEditRoom",
              controller: this,
            });
            oView.addDependent(this._oAddEditDialog);
          }

          this._oAddEditDialog.open();
        },

        onCloseAddEditDialog: function () {
          if (this._oAddEditDialog) {
            this._oAddEditDialog.close();
            setTimeout(() => {
              this._oAddEditDialog.destroy(true);
              this._oAddEditDialog = null;
            }, 300);
          }
        },

        onFileSelect: function (oEvent) {
          const oFile = oEvent.getParameter("files")[0];
          if (!oFile) return;

          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target.result.split(",")[1];
            const oVM = this.getView().getModel("viewModel");
            oVM.setProperty("/formData/File", base64);
            oVM.setProperty("/formData/FileType", oFile.type);
          };
          reader.readAsDataURL(oFile);
        },

        onSaveRoom: async function () {
          const oView = this.getView();
          const oModel = this.getOwnerComponent().getModel();
          const oForm = oView.getModel("viewModel").getProperty("/formData");
          const isEdit = !!oForm.ID;

          try {
            oView.setBusy(true);
            let savedRoom;

            // 🔹 Clean payload — remove transient fields
            const payload = { ...oForm };
            delete payload.File;
            delete payload.FileType;

            if (isEdit) {
              await new Promise((resolve, reject) => {
                oModel.update(`/Rooms(${oForm.ID})`, payload, {
                  success: () => resolve(),
                  error: (err) => reject(err),
                });
              });
              savedRoom = { ID: oForm.ID };
              MessageToast.show("Room updated successfully.");
            } else {
              savedRoom = await new Promise((resolve, reject) => {
                oModel.create("/Rooms", payload, {
                  success: (data) => resolve(data?.d || data),
                  error: (err) => reject(err),
                });
              });
              MessageToast.show("Room added successfully.");
            }

            // 🔹 Separate image upload — only if present
            if (oForm.File && oForm.FileType) {
              // 💡 CSRF Token fetch karne ka standard SAP UI5 tareeka:
              const csrfToken = oModel.getSecurityToken(); // Assuming oModel is the OData V2 model

              const uploadRes = await fetch("/odata/v2/catalog/uploadImage", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token": csrfToken, // <-- Yeh line zaroori hai
                },
                body: JSON.stringify({
                  ID: savedRoom.ID,
                  imageData: `data:${oForm.FileType};base64,${oForm.File}`,
                }),
              });
            }

            // 🔹 Cleanup
            this.onCloseAddEditDialog();
            this._loadRoomsData();
          } catch (err) {
            console.error("Save failed:", err);
            MessageBox.error("Failed to save room: " + err.message);
          } finally {
            oView.setBusy(false);
          }
        },

        onFilterSearch: function () {
          const oTable = this.byId("roomsTable");
          const oBinding = oTable.getBinding("items");
          const aFilters = [];

          // 🔹 Collect filter values
          const sCompany = this.byId("filterCompany").getSelectedKey();
          const sBranch = this.byId("filterBranch").getValue().trim();
          const sAC = this.byId("filterAC").getSelectedKey();
          const sStatus = this.byId("filterStatus").getSelectedKey();

          // 🔹 Push non-empty filters
          if (sCompany)
            aFilters.push(
              new sap.ui.model.Filter(
                "CompanyCode",
                sap.ui.model.FilterOperator.EQ,
                sCompany
              )
            );
          if (sBranch)
            aFilters.push(
              new sap.ui.model.Filter(
                "BranchCode",
                sap.ui.model.FilterOperator.Contains,
                sBranch
              )
            );
          if (sAC)
            aFilters.push(
              new sap.ui.model.Filter(
                "AC_type",
                sap.ui.model.FilterOperator.EQ,
                sAC
              )
            );
          if (sStatus)
            aFilters.push(
              new sap.ui.model.Filter(
                "BookingFlag",
                sap.ui.model.FilterOperator.EQ,
                sStatus === "true"
              )
            );

          // 🔹 Apply to table binding (client-side filter)
          oBinding.filter(aFilters);

          // Optional toast
          sap.m.MessageToast.show("Filters applied");
        },

        onFilterClear: function () {
          this.byId("filterCompany").setSelectedKey("");
          this.byId("filterBranch").setValue("");
          this.byId("filterAC").setSelectedKey("");
          this.byId("filterStatus").setSelectedKey("");
        },
      }
    );
  }
);
