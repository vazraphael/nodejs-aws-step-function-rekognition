const db = require("../../config/database");
class RekognitionTraining {
	table = "rekognition_training";
	results = null;
	id = null;
	project_arn = null;
	model_arn = null;
	async get(id = null) {
		let query = `
        SELECT
            *
        FROM rekognition_training 
        WHERE id = ?`;
		const results = await db.query(query, [id]);
		if (results.length) {
			this.populate(results[0]);
			return true;
		} else {
			return false;
		}
	}
	async list() {
		let query = `
        SELECT
            *
        FROM rekognition_training`;
		return await db.query(query);
	}
	populate(result = {}) {
		this.results = result;
		this.id = result.id || null;
		this.project_arn = result.project_arn || null;
		this.model_arn = result.model_arn || null;

	}
}
module.exports = RekognitionTraining;
