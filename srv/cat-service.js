const cds = require("@sap/cds");
const { Readable } = require("stream");

module.exports = cds.service.impl(async function () {
  const { Rooms } = this.entities;

  const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });

     const { Price } = this.entities;
this.before("CREATE", Price, (req) => {
  const { Type, PaymentName, Price: priceRaw, Currency } = req.data;

  if (!Type || !PaymentName || !priceRaw || !Currency)
    req.error(400, "All fields are required.");

  const price = parseFloat(priceRaw);

  if (isNaN(price) || price <= 0)
    req.error(400, "Price must be a positive number.");

  if (!/^[A-Z]{3}$/.test(Currency))
    req.error(400, "Currency must be a valid 3-letter ISO code.");
});



  // 🔹 Action: Upload Image
  this.on("uploadImage", async (req) => {
    try {
      const { ID, imageData } = req.data;
      if (!ID) return "Error: Room ID is required";
      if (!imageData) return "Error: imageData is required";

      let mimeType = "application/octet-stream";
      let buffer;

      if (typeof imageData === "string") {
        if (imageData.startsWith("data:")) {
          const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) return "Error: Invalid data URL format";

          mimeType = matches[1];
          buffer = Buffer.from(matches[2], "base64");
        } else {
          buffer = Buffer.from(imageData, "base64");
        }
      } else {
        return "Error: imageData must be a string";
      }

      if (!buffer || buffer.length === 0)
        return "Error: Invalid or empty image data";

      // ✅ FIXED: Add this transaction (missing earlier)
      const tx = cds.tx(req);

      const roomExists = await tx.run(SELECT.one.from(Rooms).where({ ID }));
      if (!roomExists) return `Error: Room with ID ${ID} not found`;

      await tx.run(
        UPDATE(Rooms).set({ roomPhotos: buffer, roomPhotoType: mimeType }).where({ ID })
      );

      console.log(`✅ Image uploaded for Room ID: ${ID}, size: ${buffer.length} bytes`);
      return `Image uploaded successfully (${(buffer.length / 1024).toFixed(1)} KB)`;
    } catch (error) {
      console.error("❌ Upload error:", error.message);
      return "Error: Failed to upload image - " + error.message;
    }
  });

  // 🔹 Function: Get Room Photo
  this.on("getRoomPhoto", async (req) => {
    try {
      let { ID } = req.data;
      if (typeof ID === "string") ID = ID.replace(/^guid'(.+)'$/, "$1");

      const tx = cds.tx(req);
      const result = await tx.run(
        SELECT.one.from(Rooms).columns("roomPhotos", "roomPhotoType").where({ ID })
      );

      if (!result || !result.roomPhotos) return "no photo found";

      const data = result.roomPhotos;
      let buffer = Buffer.isBuffer(data)
        ? data
        : data?.readable || typeof data?.on === "function"
        ? await streamToBuffer(data)
        : data?.value
        ? Buffer.from(data.value)
        : null;

      if (!buffer || buffer.length === 0) return "no photo found";

      const mimeType = result.roomPhotoType || "image/png";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    } catch (error) {
      console.error("❌ getRoomPhoto error:", error);
      return "Error: Failed to fetch image - " + error.message;
    }
  });

  // 🔹 Action: Delete All Rooms
  this.on("deleteAllRooms", async (req) => {
    try {
      const tx = cds.tx(req);
      const deleted = await tx.run(DELETE.from(Rooms));
      console.log(`🗑️ ${deleted} rooms deleted`);
      return `All rooms deleted successfully (${deleted} removed).`;
    } catch (error) {
      console.error("❌ deleteAllRooms error:", error);
      return "Error: Failed to delete rooms - " + error.message;
    }
  });
});
