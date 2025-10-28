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
          this._loadPrices();
        },

        _loadPrices: function () {
          const oModel = this.getOwnerComponent().getModel();
          const that = this;

          oModel.read("/Price", {
            success: function (oData) {
              const oJSON = new sap.ui.model.json.JSONModel(oData.results);
              that.getView().setModel(oJSON, "PriceModel");
            },
            error: function (oError) {
              sap.m.MessageBox.error(
                "Failed to load Prices: " + oError.message
              );
            },
          });
        },

        onAddPrice: function () {
          this._openDialog(false);
        },

        onEditPrice: function (oEvent) {
          const oCtx = oEvent.getSource().getBindingContext("PriceModel");
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

          // Use existing model on the view (persistent)
          let oDialogModel = oView.getModel("PriceDialogModel");
          if (!oDialogModel) {
            oDialogModel = new sap.ui.model.json.JSONModel();
            oDialogModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
            oView.setModel(oDialogModel, "PriceDialogModel");
          }

          oDialogModel.setData({
            isEdit: bEdit,
            PriceID: oData?.PriceID || "",
            Type: oData?.Type || "",
            PaymentName: oData?.PaymentName || "",
            Price: oData?.Price || "",
            Currency: oData?.Currency || "",
          });

          this._pDialog.open();
          F;
        },

        onSavePrice: async function () {
          const oModel = this.getOwnerComponent().getModel();
          const oData = this._pDialog.getModel("PriceDialogModel").getData();

          try {
            if (oData.isEdit) {
              await oModel.update(`/Price(${oData.PriceID})`, oData);
              MessageToast.show("Price updated");
            } else {
              await oModel.create("/Price", oData);
              MessageToast.show("Price added");
            }
            this._loadPrices();
            this._pDialog.close();
          } catch (err) {
            MessageBox.error(err.message);
          }
        },

        onDeletePrice: async function (oEvent) {
          const oCtx = oEvent.getSource().getBindingContext("PriceModel");
          const oModel = this.getOwnerComponent().getModel();
          try {
            await oModel.remove(`/Price(${oCtx.getObject().PriceID})`);
            MessageToast.show("Price deleted");
            this._loadPrices();
          } catch (err) {
            MessageBox.error(err.message);
          }
        },

        onCancelDialog: function () {
          this._pDialog.close();
        },
      }
    );
  }
);
