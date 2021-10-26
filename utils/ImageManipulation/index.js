const sharp = require("sharp");
const fs = require("fs");
class ImageManipulation {
	width = 0;
	height = 0;
	async setImage(image) {
		this.image = image;
		let { width, height } = await sharp(this.image).metadata();
		this.width = width;
		this.height = height;
	}
	async drawRectangle(results = {}) {
		let composites = [];
		let instances = this.getOnlyGeometrys(results);
		for (let index = 0; index < instances.length; index++) {
			const instance = instances[index];
			const position = instance.BoundingBox;
			const marks = Buffer.from(
				`<svg><rect x="4px" y="4px" width="${parseInt(this.width * position.Width, 10)}px" height="${parseInt(this.height * position.Height, 10)}px" fill="none" stroke="#0F0" stroke-width="8px" /></svg>`
			);
			composites.push({
				input: marks,
				top: parseInt(this.height * position.Top),
				left: parseInt(this.width * position.Left),
			});
		}
		try {
			let image = await sharp(this.image).composite(composites).jpeg().toBuffer();
			return image;
			// fs.writeFileSync(__dirname + "/test/image.jpg", image);
		} catch (error) {
			console.log(error);
		}
	}
	getOnlyGeometrys(results){
		let geometrys = [];
		if(results.CustomLabels){
			for (let index = 0; index < results.CustomLabels.length; index++) {
				const label = results.CustomLabels[index];
				geometrys.push(label.Geometry);
			}
		}
		return geometrys;
	}
}

module.exports = ImageManipulation;
