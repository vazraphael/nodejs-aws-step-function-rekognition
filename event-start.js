
exports.handler = async (event) => {
    /**
     * Example list of images to analyze in a S3 bucket.
     * Here you can get a list from a database
     * Example: const images = await db.query(`SELECT * FROM images WHERE analyzed = 0`);
     */
    const images = require("./images");

    return images.length ? "start" : "stop";
};