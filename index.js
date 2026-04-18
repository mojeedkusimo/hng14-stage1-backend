import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());

const PORT = 3030;

const getName = async (name) => {

    try {

        const response = await axios.get(`https://api.genderize.io/?name=${name}`);
        console.log(response)
        return response.data;
    } catch (e) {
        return "Could not fetch any name at this time.";
    }
}


app.get('/api/classify', async (req, res) => {

    const name = req.query.name;
    const result = await getName(name);

    const isConfident = result.probability >= 0.7 & result.count >= 100 ? true : false;



    try {

        if (!name) return res.status(400).json({ "status": "error", "message": "Missing or empty name" });

        if (!isNaN(name)) return res.status(422).json({ "status": "error", "message": "Non-string name" });

        if (!result.gender || result.count == 0) return res.status(500).json({ "status": "error", "message": "No prediction available for the provided name" });

        return res.status(200).json({
            status: "success",
            data: {
                name: name,
                gender: result.gender,
                probability: result.probability,
                sample_size: result.count,
                is_confident: isConfident,
                processed_at: new Date().toISOString()
            }
        });

    } catch (e) {
        return res.status(500).send({ "status": "error", "message": "Could not fetch any name at this time." });
    }
});


app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});