const cds = require("@sap/cds");
const cov2ap = require("@cap-js-community/odata-v2-adapter");

module.exports = cds.service.impl(function () {
    cds.on("bootstrap", (app) => {
        app.use(cov2ap());
    });

    const { Rooms } = this.entities;
    const db = cds.connect.to("db");

    // this.on("CREATE", Rooms, async (req) => {

    //     const { roomPhotos } = req.data;

    //     if (!roomPhotos) {
    //         return req.error(400, "No image data provided");
    //     }

    //     // Remove base64 header if present (e.g., "data:image/png;base64,")
    //     const base64Data = roomPhotos.includes(",") ? roomPhotos.split(",")[1] : roomPhotos;

    //     // Convert base64 to binary buffer
    //     const buffer = Buffer.from(base64Data, "base64");

    //     // Insert or update the image in Rooms table
    //     await db.run(
    //         INSERT.into(Rooms).entries({
    //             roomPhotos: buffer
    //         })
    //     );

    //     return { message: "Image uploaded successfully" };
    // });


    this.on("uploadImage", async (req) => {
        const { ID, imageData } = req.data;

        if (!imageData) {
            return req.error(400, "No image data provided");
        }

        // Remove base64 header if present (e.g., "data:image/png;base64,")
        const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;

        // Convert base64 to binary buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Insert or update the image in Rooms table
        await cds.tx(req).run(
            UPDATE(Rooms)
                .set({ roomPhotos: buffer })
                .where({ ID })
        );

        return { message: "Image uploaded successfully" };
    });

     this.on("deleteAllRooms", async (req) => {
    const db = await cds.connect.to("db");
    await db.run(DELETE.from(Rooms));
    return "All rooms deleted successfully!";
  });
});