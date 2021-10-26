if (!process.env.MY_AWS_ACCESS_KEY_ID) {
	require("dotenv/config");
}

const AWS = require("aws-sdk");
const Rekognition = new AWS.Rekognition({
	accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_DEFAULT_REGION,
});
class CustomRekognition {
	names = [];
	project_arn = "";
	model_arn = "";
	detect(params) {
		return new Promise((resolve, reject) => {
			params.ProjectVersionArn = this.model_arn;
			params.MaxResults = process.env.REKOGNITION_MAX_RESULTS;
			params.MinConfidence = process.env.REKOGNITION_MIN_CONFIDENCE;
			Rekognition.detectCustomLabels(params, function (err, response) {
				if (err) {
					console.log(err, err.stack); // an error occurred
					reject(err);
				} else {
					resolve(response);
				}
			});
		});
	}
	analyze(json) {
		if (typeof json == "string") {
			json = JSON.parse(json);
		}
		let count = 0;
		let instances = [];
		let names = [];
		if (json.CustomLabels) {
			count = json.CustomLabels.length;
			for (let index = 0; index < json.CustomLabels.length; index++) {
				const label = json.CustomLabels[index];
				if (this.names.indexOf(label.Name) > -1) {
					if (names.indexOf(label.Name) == -1) {
						names.push(label.Name);
					}
					instances.push(
						{
							Confidence: label.Confidence,
							BoundingBox: label.Geometry.BoundingBox
						}
					)
				}
			}
		}
		return {
			count: count,
			name: names,
			instances: instances,
		};
	}
}
module.exports = CustomRekognition;
