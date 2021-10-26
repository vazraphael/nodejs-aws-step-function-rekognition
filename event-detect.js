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
const ImageManipulation = require("./utils/ImageManipulation");
const CustomRekognition = require("./utils/Rekognition/CustomRekognition");

exports.handler = async (event) => {
    /**
     * Example list of images to analyze in a S3 bucket.
     * Here you can get a list from a database
     * Example: const images = await db.query(`SELECT * FROM images WHERE analyzed = 0`);
     */
    const images = require("./images");

    const imageManipulation = new ImageManipulation();
    const customRekognition = new CustomRekognition();

    if (images.length) {
        for (let index = 0; index < images.length; index++) {
            const image = images[index];

            // analyze
            let params = {
                Image: {
                    S3Object: {
                        Bucket: process.env.BUCKET_NAME,
                        Name: image
                    },
                },
            };
            // this is the JSON response from AWS Rekognition.
            let rekognitionResponse = await customRekognition.detect(params);

            // download the original file from S3
            try {
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: image
                };
                var originalImage = await S3.getObject(params).promise();
            } catch (error) {
                console.log(error);
                return;
            }

            // mark image with JSON response from AWS Rekognition
            await imageManipulation.setImage(originalImage.Body);
            let analyzedImage = await imageManipulation.drawRectangle(rekognitionResponse);
            try {
                /**
                 * upload analyzed image to a subfolder
                 * you decide the path or image name 
                */
                let key = `${image}`.split("/");
                key.splice(key.length - 1, 0, 'analyzed');
                key = key.join("/");
                const destparams = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: key,
                    Body: analyzedImage,
                    ContentType: "image",
                    ACL: "public-read"
                };
                await S3.putObject(destparams).promise();

                /**
                 * here you can update your database with the path of the analyzed image
                 * example: `update image set file_path_analyzed = "${key}" where id = ?`
                 */


            } catch (error) {
                console.log(error);
                return;
            }
            /**
             * here you can set in your database as image processed
             * example: `update image set processed = 1 where id = ?`
             */
        }
    }
    return;
};