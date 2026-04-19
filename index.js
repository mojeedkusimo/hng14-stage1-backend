import express, { json } from "express";
import cors from "cors";
import axios from "axios";
import { uuidv7 } from "uuidv7";

const app = express();
app.use(cors());
app.use(json());

let database = [];

const PORT = 3030;

const getName = async (name) => {

    try {

        const response = await axios.get(`https://api.genderize.io/?name=${name}`);

        return response.data;
    } catch (e) {
        return "Could not fetch any name at this time.";
    }
}

const getAge = async (name) => {

    try {

        const response = await axios.get(`https://api.agify.io/?name=${name}`);

        switch (true) {
            case response.data.age >= 0 && response.data.age <= 12:
                response.data.age_group = 'child'
                break;
            case response.data.age >= 13 && response.data.age <= 19:
                response.data.age_group = 'teenager'
                break;
            case response.data.age >= 20 && response.data.age <= 59:
                response.data.age_group = 'adult'
                break
            case response.data.age > 59:
                response.data.age_group = 'senior'
                break;
            default:
                response.data.age_group = 'unknown'
                break;
        }
        return response.data;
    } catch (e) {
        return "Could not fetch any name at this time.";
    }
}

const getCountry = async (name) => {

    try {

        const response = await axios.get(`https://api.nationalize.io/?name=${name}`);

        response.data.country = response.data.country[0];

        return response.data;
    } catch (e) {
        return "Could not fetch any name at this time.";
    }
}

app.get('/api/profiles', async (req, res) => {

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

app.post('/api/profiles', async (req, res) => {

    const { name } = req.body;
    const resultName = await getName(name);
    const resultAge = await getAge(name);
    const resultCountry = await getCountry(name);
    const uuid = uuidv7();

    try {

        if (!name) return res.status(400).json({ "status": "error", "message": "Missing or empty name" });

        if (!isNaN(name)) return res.status(422).json({ "status": "error", "message": "Non-string name" });

        if (!resultName.gender || resultName.count == 0) return res.status(500).json({ "status": "error", "message": "No prediction available for the provided name" });

        const newName = {
            id: uuid,
            name: name,
            gender: resultName.gender,
            gender_probability: resultName.probability,
            sample_size: resultName.count,
            age: resultAge.age,
            age_group: resultAge.age_group,
            country_id: resultCountry.country.country_id,
            country_probability: resultCountry.country.probability,
            created_at: new Date().toISOString()
        }

        const uniqueNameChecker = database.find(item => item.name === newName.name);
        // console.log(database);
        // console.log(uniqueNameChecker);

        if (!uniqueNameChecker) {
            database.push(newName);

            return res.status(201).json({
                status: "success",
                data: newName
            });
        }

        return res.status(200).json({
            status: "success",
            "message": "Profile already exists",
            data: uniqueNameChecker
        });

    } catch (e) {
        return res.status(500).send({ "status": "error", "message": "Could not fetch any name at this time." });
    }
});


app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});