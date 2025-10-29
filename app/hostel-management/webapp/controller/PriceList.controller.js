sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
  ],
  function (Controller, JSONModel, MessageToast, MessageBox, Fragment) {
    "use strict";

    return Controller.extend(
      "hostel.com.hostelmanagement.controller.PriceList",
      {
        onInit: function () {
          // Initialize dialog model in controller
          this._oDialogModel = new JSONModel({
            isEdit: false,
            PriceID: "",
            Type: "",
            PaymentName: "",
            Price: "",
            Currency: "",
          });
          this.getView().setModel(this._oDialogModel, "PriceDialogModel");

          this._loadPrices();
        },

        _loadPrices: function () {
          const oModel = this.getOwnerComponent().getModel();
          const that = this;

          oModel.read("/Price", {
            success: function (oData) {
              const oJSON = new JSONModel(oData.results);
              that.getView().setModel(oJSON, "PriceModel");
            },
            error: function (oError) {
              MessageBox.error("Failed to load Prices: " + oError.message);
            },
          });
        },

        onAddPrice: function () {
          this._openDialog(false);
        },

        onEditPrice: function () {
          const oTable = this.byId("priceTable");
          const oSelected = oTable.getSelectedItem();
          if (!oSelected) {
            MessageToast.show("Please select a row to edit");
            return;
          }
          const oCtx = oSelected.getBindingContext("PriceModel");
          this._openDialog(true, oCtx.getObject());
        },

        _openDialog: async function (bEdit, oData) {
          const oView = this.getView();

          if (!this._pDialog) {
            this._pDialog = await Fragment.load({
              id: oView.getId(),
              name: "hostel.com.hostelmanagement.fragments.PriceDialog",
              controller: this,
            });
            oView.addDependent(this._pDialog);
          }

          // Create a fresh model for the dialog with two-way binding
          const oDialogModel = new JSONModel({
            isEdit: bEdit,
            PriceID: oData?.PriceID || "",
            Type: oData?.Type || "",
            PaymentName: oData?.PaymentName || "",
            Price: oData?.Price || "",
            Currency: oData?.Currency || "",
          });

          // Set binding mode to TwoWay explicitly
          oDialogModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
          this._pDialog.setModel(oDialogModel, "PriceDialogModel");

          // Force refresh of bindings
          this._pDialog.bindElement({
            path: "/",
            model: "PriceDialogModel",
          });

          this._pDialog.open();
        },

        onSelectionChange: function (oEvent) {
          const oTable = this.byId("priceTable");
          const oSelected = oTable.getSelectedItem();

          // enable/disable header buttons based on selection
          this.byId("btnEdit").setEnabled(!!oSelected);
          this.byId("btnDelete").setEnabled(!!oSelected);
        },
        onSavePrice: async function () {
          const oModel = this.getOwnerComponent().getModel();
          const oDialogModel = this._pDialog.getModel("PriceDialogModel");
          const oData = oDialogModel.getData();

          // Basic client validation
          if (
            !oData.Type ||
            !oData.PaymentName ||
            !oData.Price ||
            !oData.Currency
          ) {
            MessageBox.error("Please fill in all fields");
            return;
          }

          const priceValue = parseFloat(oData.Price);
          if (isNaN(priceValue)) {
            MessageBox.error("Please enter a valid price");
            return;
          }

          const formattedPrice = parseFloat(priceValue.toFixed(2));

          const oSubmitData = {
            Type: oData.Type,
            PaymentName: oData.PaymentName,
            Price: formattedPrice, // ✅ keep as number, not string
            Currency: oData.Currency.toUpperCase(),
          };

          try {
            await new Promise((resolve, reject) => {
              if (oData.isEdit && oData.PriceID) {
                oModel.update(`/Price(${oData.PriceID})`, oSubmitData, {
                  success: resolve,
                  error: reject,
                });
              } else {
                oModel.create("/Price", oSubmitData, {
                  success: resolve,
                  error: reject,
                });
              }
            });

            MessageToast.show(
              oData.isEdit
                ? "Price updated successfully"
                : "Price added successfully"
            );

            this._loadPrices();
            this._pDialog.close();
          } catch (err) {
            // Here you’ll actually catch CAP validation errors, like String(3) violation
            const sErrorMessage = err?.message || "Unknown error from backend.";
            MessageBox.error("Failed to save price: " + sErrorMessage);
          }
        },

        onDeletePrice: function () {
          const oTable = this.byId("priceTable");
          const oSelected = oTable.getSelectedItem();
          if (!oSelected) {
            MessageToast.show("Please select a row to delete");
            return;
          }

          const oCtx = oSelected.getBindingContext("PriceModel");
          const oModel = this.getOwnerComponent().getModel();

          MessageBox.confirm(
            `Are you sure you want to delete "${
              oCtx.getObject().PaymentName
            }"?`,
            {
              actions: [MessageBox.Action.YES, MessageBox.Action.NO],
              onClose: async (sAction) => {
                if (sAction === MessageBox.Action.YES) {
                  try {
                    await oModel.remove(`/Price(${oCtx.getObject().PriceID})`);
                    MessageToast.show("Price deleted");
                    this._loadPrices();

                    // reset selection and disable buttons
                    oTable.removeSelections();
                    this.byId("btnEdit").setEnabled(false);
                    this.byId("btnDelete").setEnabled(false);
                  } catch (err) {
                    MessageBox.error(err.message);
                  }
                }
              },
            }
          );
        },

        onCancelDialog: function () {
          this._pDialog.close();
          this._resetDialogData();
        },

        _resetDialogData: function () {
          this._oDialogModel.setData({
            isEdit: false,
            PriceID: "",
            Type: "",
            PaymentName: "",
            Price: "",
            Currency: "",
          });
        },
               onBack: function () {
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter ? oRouter.navTo("AdminTile") : window.history.back();
        },
        onFilterSearch: function (oEvent) {
    const oView = this.getView();
    const oTable = oView.byId("priceTable");
    const oBinding = oTable.getBinding("items");
    const aFilters = [];

    const sType = oView.byId("filterType").getSelectedKey();
    const sPaymentName = oView.byId("filterPaymentName").getValue();
    const sCurrency = oView.byId("filterCurrency").getSelectedKey();
    const sPriceMin = oView.byId("filterPriceMin").getValue();
    const sPriceMax = oView.byId("filterPriceMax").getValue();

    if (sType) aFilters.push(new sap.ui.model.Filter("Type", "EQ", sType));
    if (sPaymentName) aFilters.push(new sap.ui.model.Filter("PaymentName", "Contains", sPaymentName));
    if (sCurrency) aFilters.push(new sap.ui.model.Filter("Currency", "EQ", sCurrency));

    if (sPriceMin && sPriceMax) {
        aFilters.push(new sap.ui.model.Filter({
            filters: [
                new sap.ui.model.Filter("Price", "GE", parseFloat(sPriceMin)),
                new sap.ui.model.Filter("Price", "LE", parseFloat(sPriceMax))
            ],
            and: true
        }));
    } else if (sPriceMin) {
        aFilters.push(new sap.ui.model.Filter("Price", "GE", parseFloat(sPriceMin)));
    } else if (sPriceMax) {
        aFilters.push(new sap.ui.model.Filter("Price", "LE", parseFloat(sPriceMax)));
    }

    oBinding.filter(aFilters);
},

onFilterClear: function () {
    const oView = this.getView();
    oView.byId("filterType").setSelectedKey("");
    oView.byId("filterPaymentName").setValue("");
    oView.byId("filterCurrency").setSelectedKey("");
    oView.byId("filterPriceMin").setValue("");
    oView.byId("filterPriceMax").setValue("");
},


      }
    );
  }
);
