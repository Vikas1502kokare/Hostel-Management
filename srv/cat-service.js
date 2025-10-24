//srv/service.js

const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {
  const { Rooms } = this.entities;
  const db = cds.connect.to("db");

  this.before("CREATE", Rooms, async (req) => {
    const { RoomNo, BranchCode } = req.data;

    const exists = await cds.run(
      SELECT.one.from(Rooms).where({ RoomNo, BranchCode })
    );
    if (exists)
      req.error(
        400,
        "A room with this number already exists in the same branch."
      );
  });

  this.before("UPDATE", Rooms, async (req) => {});

  this.on("uploadImage", async (req) => {
    const { ID, imageData } = req.data;

    if (!imageData) {
      return req.error(400, "No image data provided");
    }

    // Remove base64 header if present (e.g., "data:image/png;base64,")
    const base64Data = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;

    // Convert base64 to binary buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Insert or update the image in Rooms table
    await cds
      .tx(req)
      .run(UPDATE(Rooms).set({ roomPhotos: buffer }).where({ ID }));

    return { message: "Image uploaded successfully" };
  });

  this.on("deleteAllRooms", async (req) => {
    const db = await cds.connect.to("db");
    await db.run(DELETE.from(Rooms));
    return "All rooms deleted successfully!";
  });
});
