if (!process.env.MY_AWS_ACCESS_KEY_ID) {
	require("dotenv/config");
}
const NotFoundError = require("../errors/NotFoundError");
const RekognitionTraining = require("../models/RekognitionTraining");
const AWS = require("aws-sdk");
const Rekognition = new AWS.Rekognition({
	accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_DEFAULT_REGION,
});
class TrainingController {
	constructor() {
		this.RekognitionTraining = new RekognitionTraining();
	}
	async get(id) {
		id = parseInt(id, 10) || 0;
		if (await this.RekognitionTraining.get(id)) {
			let training = this.RekognitionTraining.results;
			let version = this.RekognitionTraining.model_arn.split("version/")[1];
			version = version.split("/")[0];
			training.version = version;
			await this.getProjectInfo(training);
			return training;
		} else {
			throw new NotFoundError();
		}
	}
	async stop(id) {
		let training = await this.get(id);
		if (training.status == "RUNNING" || training.status == "STARTING") {
			try {
				let params = {
					ProjectVersionArn: this.RekognitionTraining.model_arn
				};
				await Rekognition.stopProjectVersion(params).promise();
				await this.getProjectInfo(training);
				return {}
			} catch (error) {

			}
		}
		return { status: training.status }
	}
	async start(id) {
		let training = await this.get(id);
		if (training.status != "RUNNING" && training.status != "STARTING" && training.status != "NOT_FOUND" && training.status != "STOPPING") {
			try {
				let params = {
					MinInferenceUnits: 1,
					ProjectVersionArn: this.RekognitionTraining.model_arn
				};
				await Rekognition.startProjectVersion(params).promise();
				await this.getProjectInfo(training);
				return training;
			} catch (error) {
				throw error;
			}
		}
	}
	async getProjectInfo(training) {
		try {
			training.status = "NOT_FOUND";
			let params = {
				ProjectArn: this.RekognitionTraining.project_arn,
				VersionNames: [training.version]
			};
			let results = await Rekognition.describeProjectVersions(params).promise();
			if (results.ProjectVersionDescriptions && results.ProjectVersionDescriptions.length) {
				for (let index = 0; index < results.ProjectVersionDescriptions.length; index++) {
					const ProjectVersionDescription = results.ProjectVersionDescriptions[index];
					training.status = ProjectVersionDescription.Status;
				}
			}
			// training.status = "RUNNING";
		} catch (error) {
			console.log(error);
		}
	}
}
module.exports = TrainingController;
