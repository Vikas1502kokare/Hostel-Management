//srv/server.js

const cds = require("@sap/cds");
const express = require("express");
const fileUpload = require("express-fileupload");
const cov2ap = require("@sap/cds-odata-v2-adapter-proxy");

cds.on("bootstrap", app => {
  // Increase default body limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Allow multipart uploads
  app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

  // 🔹 Enable OData V2 adapter
  app.use(cov2ap({
    path: "odata/v2",      // external path
    target: "odata/v4"     // internal CAP service path
  }));

  // 🔹 Direct upload endpoint
  app.post("/uploadRoomPhoto", async (req, res) => {
    try {
      const db = await cds.connect.to("db");
      const { Rooms } = db.entities;

      const { roomId } = req.body;
      if (!roomId) return res.status(400).send("Missing roomId");

      const file = req.files?.file;
      if (!file) return res.status(400).send("Missing file");

      await db.run(
        UPDATE(Rooms).set({
          roomPhotos: file.data,
          roomPhotoType: file.mimetype
        }).where({ ID: roomId })
      );

      res.send(`✅ File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error("Upload error:", e);
      res.status(500).send("Upload failed: " + e.message);
    }
  });
});

cds.on("served", () => {
  if (cds.server) cds.server.timeout = 120000;
});

module.exports = cds.server;
