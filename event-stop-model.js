if (!process.env.MY_AWS_ACCESS_KEY_ID) {
    require("dotenv/config");
}
const TrainingController = require("./api/controllers/TrainingController");
const RekognitionTraining = require("./api/models/RekognitionTraining");

exports.handler = async (event) => {
    // para todos os treinamentos
    const rekognitionTraining = new RekognitionTraining();
    const trainingController = new TrainingController();
    const treinamentos = await rekognitionTraining.list();
    for (let index = 0; index < treinamentos.length; index++) {
        const treinamento = treinamentos[index];
        await trainingController.stop(treinamento.id);
    }
};