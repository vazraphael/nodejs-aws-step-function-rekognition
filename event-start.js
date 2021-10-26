if (!process.env.MY_AWS_ACCESS_KEY_ID) {
    require("dotenv/config");
}

const Image = require("./api/models/Image");

exports.handler = async (event) => {
    const image = new Image();
    let pendents = await image.getPendents();
    return pendents.length ? "start" : "stop";
};