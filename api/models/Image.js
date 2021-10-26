const db = require("../../config/database");
const ToBit = require("../utils/ToBit");
class Image {
	table = "image";
	id = null;
	id_rekognition_training = null;
	file_path_original = null;
	file_path_analyzed = null;
	rekognition_results = null;
	analyzed = null;
	async get(id = null) {
		let query = `
        SELECT
            *
        FROM image 
        WHERE id = ?`;
		const results = await db.query(query, [id]);
		if (results.length) {
			this.populate(results[0]);
			return true;
		} else {
			return false;
		}
	}
	async list(params = { id_rekognition_training: null, analyzed: null }) {
		let data = [];
		let where = [];

		if (params.id_rekognition_training) {
			where.push("id_rekognition_training = ?");
			data.push(parseInt(params.id_rekognition_training));
		}
		if (params.analyzed != null && params.analyzed != undefined) {
			where.push("id_rekognition_training = ?");
			data.push(ToBit(params.id_rekognition_training));
		}

		let query = `
        SELECT
            *
        FROM image 
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`;
		return await db.query(query, data);
	}
	async getPendents(){
		let query = `
		SELECT
			id_rekognition_training
		FROM image
		WHERE analyzed = 0
		GROUP BY id_rekognition_training
		`;
		return await db.query(query);
	}
	async update() {
		let query = `UPDATE image SET file_path_original = ?, file_path_analyzed = ?, analyzed = ? WHERE id = ?`;
		const results = await db.query(query, [
			this.file_path_original,
			this.file_path_analyzed,
			this.analyzed,
			this.id
		]);
		return results.affectedRows == 1;
	}
	populate(result = {}) {
		this.id = result.id || null;
		this.id_rekognition_training = result.id_rekognition_training || null;
		this.file_path_original = result.file_path_original || null;
		this.file_path_analyzed = result.file_path_analyzed || null;
		this.rekognition_results = result.rekognition_results || null;
		this.analyzed = ToBit(result.analyzed);
	}
}
module.exports = Image;
