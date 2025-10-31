sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "hostel/com/hostelmanagement/model/formatter",
  ],
  function (Controller, MessageToast, formatter) {
    "use strict";

    return Controller.extend("hostel.com.hostelmanagement.controller.View1", {
      formatter: formatter,

      onInit: function () {
        const oModel = this.getOwnerComponent().getModel();
        this.getView().setModel(oModel);

        this.byId("roomsTable")
          ?.getBinding("items")
          ?.filter([
            new sap.ui.model.Filter(
              "BookingFlag",
              sap.ui.model.FilterOperator.EQ,
              false
            ),
          ]);
        this._openBranchDialog();
      },
      onImageError: function (oEvent) {
        const oImage = oEvent.getSource();
        const sFallback = sap.ui.require.toUrl(
          "hostel/com/hostelmanagement/images/no-image.png"
        );
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
        return sap.ui.require.toUrl(
          "hostel/com/hostelmanagement/images/no-image.png"
        );
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
        }, 4000);
      },

      OnAdminTile: function (oEvent) {
        this.getOwnerComponent().getRouter().navTo("AdminTile");
      },

      LoginPage: function () {
        this.getOwnerComponent().getRouter().navTo("Login");
      },

      onNavigateToBooking: function () {
        this.getOwnerComponent().getRouter().navTo("BookingPage");
      },

      /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // === BRANCH DIALOG LOGIC ===

      
      _openBranchDialog: function () {
  const oView = this.getView();
  const oModel = oView.getModel();

  oModel.read("/Rooms", {
    success: (oData) => {
      const branchMap = new Map();

      // Loop through all rooms and count only available ones
      oData.results.forEach((room) => {
        if (room.BranchCode && room.BookingFlag === false) {
          // Room is available
          if (!branchMap.has(room.BranchCode)) {
            branchMap.set(room.BranchCode, 1);
          } else {
            branchMap.set(room.BranchCode, branchMap.get(room.BranchCode) + 1);
          }
        }
      });

      // Build the list of branches that have available rooms only
      const availableBranches = [];
      for (const [BranchCode, count] of branchMap.entries()) {
        availableBranches.push({
          BranchCode: BranchCode,
          BranchName: BranchCode, // Change later if you have real names
          AvailableRooms: count,
        });
      }

      // Create JSON model for the fragment dropdown
      const branchModel = new sap.ui.model.json.JSONModel({
        Branches: availableBranches,
      });
      oView.setModel(branchModel, "branches");

      // Open dialog
      if (!this._pDialog) {
        this._pDialog = sap.ui.xmlfragment(
          oView.getId(),
          "hostel.com.hostelmanagement.fragments.BranchSelector",
          this
        );
        oView.addDependent(this._pDialog);
      }

      this._pDialog.open();
    },
    error: (err) => {
      console.error("Error fetching room data:", err);
      sap.m.MessageBox.error("Unable to load branches. Please try again later.");
    },
  });
},


      onBranchConfirm: function () {
        const oSelect = this.byId("branchSelect");
        const sSelectedBranch = oSelect.getSelectedKey();
        const oModel = this.getView().getModel();

        if (!sSelectedBranch) {
          sap.m.MessageToast.show("Please select a branch first");
          return;
        }

        // Read from OData to check if this branch has rooms
        oModel.read("/Rooms", {
          filters: [
            new sap.ui.model.Filter(
              "BranchCode",
              sap.ui.model.FilterOperator.EQ,
              sSelectedBranch
            ),
          ],
          success: (oData) => {
            if (oData.results.length > 0) {
              // At least one room exists — proceed
              sap.m.MessageToast.show(`Branch ${sSelectedBranch} selected`);
              this._pDialog.close();
              this._filterRoomsByBranch(sSelectedBranch);
            } else {
              // No rooms — show message and hide this branch
              sap.m.MessageBox.warning(
                `No rooms found in branch ${sSelectedBranch}. Please choose another location.`
              );

              this._hideBranchFromDropdown(sSelectedBranch);
            }
          },
          error: (err) => {
            console.error("Failed to check branch:", err);
            sap.m.MessageBox.error(
              "Error reading room data. Please try again later."
            );
          },
        });
      },
      _hideBranchFromDropdown: function (sBranchCode) {
        const oSelect = this.byId("branchSelect");
        const oBinding = oSelect.getBinding("items");

        if (!oBinding) return;

        // Get current model data
        const oModel = oBinding.getModel();
        const aBranches = oModel.getProperty("/Branches") || [];

        // Remove the invalid branch
        const filtered = aBranches.filter((b) => b.BranchCode !== sBranchCode);

        oModel.setProperty("/Branches", filtered);
        sap.m.MessageToast.show(`Branch ${sBranchCode} hidden from list`);
      },

      onBranchDialogClose: function () {
        this._pDialog.destroy();
        this._pDialog = null;
      },

      _filterRoomsByBranch: function (branchCode) {
        const oFlexBox = this.byId("roomsContainer");

        if (!oFlexBox) {
          console.error("Rooms container not found.");
          return;
        }

        const oBinding = oFlexBox.getBinding("items");
        if (!oBinding) {
          console.warn("No binding found for room items.");
          return;
        }

        const aFilters = [
          new sap.ui.model.Filter(
            "BranchCode",
            sap.ui.model.FilterOperator.EQ,
            branchCode
          ),
          new sap.ui.model.Filter(
            "BookingFlag",
            sap.ui.model.FilterOperator.EQ,
            false
          ), // only available rooms
        ];

        oBinding.filter(aFilters);
      },
    });
  }
);
