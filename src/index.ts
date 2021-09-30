import express from 'express';
import * as fs from 'fs';
import {getUniqueOwners} from "./helpers/owner";
const fsPromises = fs.promises;


// rest of the code remains same
const app = express();
const PORT = 42424;


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// get all minted tickets
app.get('/tickets/', async (req, res) => {
    let mintFile = await fsPromises.readFile('mints_details.json', 'utf-8');
    if(mintFile){
        let mints = JSON.parse(mintFile);
        res.send(mints);
    }
});

// get all minted tickets
app.get('/owners/', async (req, res) => {
    const owners = await getUniqueOwners();
    if(owners){
        res.send(owners);
    }
});


app.listen(PORT, () => {
    console.log(`[server]: Server is running at https://localhost:${PORT}`);
});
