if (!process.env.MY_AWS_ACCESS_KEY_ID) {
    require("dotenv/config");
}
const AWS = require("aws-sdk");
const S3 = new AWS.S3({
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
});
const TrainingController = require("./api/controllers/TrainingController");
const Image = require("./api/models/Image");
const ImageManipulation = require("./api/utils/ImageManipulation");
const CustomRekognition = require("./api/utils/Rekognition/CustomRekognition");

exports.handler = async (event) => {
    const image = new Image();
    const imageManipulation = new ImageManipulation();
    const trainingController = new TrainingController();
    const customRekognition = new CustomRekognition();
    // get list of pendent id_rekognition_training
    let ids_rekognition_training = await image.getPendents();
    if (ids_rekognition_training.length) {
        for (let index = 0; index < ids_rekognition_training.length; index++) {
            const id_rekognition_training = ids_rekognition_training[index];
            image.populate(task);

            // verify if the model is running again
            let training = await trainingController.get(id_rekognition_training);
            if (training.status == "RUNNING") {
                customRekognition.project_arn = training.project_arn;
                customRekognition.model_arn = training.model_arn;

                // get image list
                let images = await image.list({analyzed: 0, id_rekognition_training: id_rekognition_training});
                if (images.length) {
                    for (let index = 0; index < images.length; index++) {
                        const _image = images[index];
                        image.populate(_image);
                        var filename = `${image.file_path_original}`.split("/")[2];

                        // analyze
                        let params = {
                            Image: {
                                S3Object: {
                                    Bucket: process.env.BUCKET_NAME,
                                    Name: image.file_path_original
                                },
                            },
                        };
                        let rekognitionResponse = await customRekognition.detect(params);
                        image.rekognition_results = JSON.stringify(rekognitionResponse);

                        // download the original file
                        try {
                            const params = {
                                Bucket: process.env.BUCKET_NAME,
                                Key: image.file_path_original
                            };
                            var originalImage = await S3.getObject(params).promise();
                        } catch (error) {
                            console.log(error);
                            return;
                        }

                        // mark image
                        await imageManipulation.setImage(originalImage.Body);
                        let imagemAnalisada = await imageManipulation.drawRectangle(rekognitionResponse);
                        try {
                            // upload analyzed image
                            let key = "images/analyzed/" + filename;
                            const destparams = {
                                Bucket: process.env.BUCKET_NAME,
                                Key: key,
                                Body: imagemAnalisada,
                                ContentType: "image",
                                ACL: "public-read"
                            };
                            const putResult = await S3.putObject(destparams).promise();
                            image.file_path_analyzed = key;
                            await image.update();
                        } catch (error) {
                            console.log(error);
                            return;
                        }
                        image.analyzed = 1;
                        await image.update();
                    }
                }
            }
        }
    }
    return;
};
// handler();