const cds = require("@sap/cds");
const express = require("express");
const cov2ap = require("@cap-js-community/odata-v2-adapter");

cds.on("bootstrap", app => {
  // normal limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // --- patch CAP’s batch parser ---
  const batch = require("@sap/cds/libx/odata/middleware/batch");
  const orig = batch.odata_batch;
  batch.odata_batch = function (req, res, next) {
    express.raw({ type: "*/*", limit: "50mb" })(req, res, err => {
      if (err) return next(err);
      return orig(req, res, next);
    });
  };

  app.use(cov2ap());
});

cds.on("served", () => {
  if (cds.server) cds.server.timeout = 120000;
});

module.exports = cds.server;
