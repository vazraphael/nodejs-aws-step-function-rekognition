if (!process.env.REKOGNITION_MODEL_ARN) {
    require("dotenv/config");
}
const AWS = require("aws-sdk");
const Rekognition = new AWS.Rekognition({
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
});
exports.handler = async (event) => {
    try {
        let params = {
            ProjectVersionArn: process.env.REKOGNITION_MODEL_ARN
        };
        await Rekognition.stopProjectVersion(params).promise();
        return;
    } catch (error) {
        throw error;
    }
};