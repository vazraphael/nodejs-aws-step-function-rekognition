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
    // get the current status of model
    let status = "NOT_FOUND";
    let version = process.env.REKOGNITION_MODEL_ARN.split("version/")[1].split("/")[0];
    let params = {
        ProjectArn: process.env.REKOGNITION_PROJECT_ARN,
        VersionNames: [version]
    };
    let results = await Rekognition.describeProjectVersions(params).promise();
    if (results.ProjectVersionDescriptions && results.ProjectVersionDescriptions.length) {
        for (let index = 0; index < results.ProjectVersionDescriptions.length; index++) {
            const ProjectVersionDescription = results.ProjectVersionDescriptions[index];
            status = ProjectVersionDescription.Status;
        }
    }
    if (status != "RUNNING" && status != "STARTING" && status != "NOT_FOUND" && status != "STOPPING") {
        // start model
        try {
            let params = {
                MinInferenceUnits: 1,
                ProjectVersionArn: process.env.REKOGNITION_MODEL_ARN
            };
            await Rekognition.startProjectVersion(params).promise();
        } catch (error) {
            throw error;
        }
        await trainingController.start(id);
    }
    return status.toUpperCase();
};