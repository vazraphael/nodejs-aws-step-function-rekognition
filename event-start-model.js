if (!process.env.MY_AWS_ACCESS_KEY_ID) {
    require("dotenv/config");
}
const TrainingController = require("./api/controllers/TrainingController");
const Image = require("./api/models/Image");

exports.handler = async (event) => {
    const image = new Image();
    const trainingController = new TrainingController();
    // get all ids of the pendent training
    let ids = await image.getPendents();
    // only return running when all are running
    let isAllRunning = true;
    for (let index = 0; index < ids.length; index++) {
        const id = ids[index].id_rekognition_training;
        let training = await trainingController.get(id);
        if (training.status != "RUNNING") {
            isAllRunning = false;
        }
        if (training.status != "RUNNING" && training.status != "STARTING") {
            // start model
            await trainingController.start(id);
        }
    }
    if (isAllRunning) {
        return "RUNNING";
    } else {
        return "STARTING";
    }
};