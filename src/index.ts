import express from 'express';
import * as fs from 'fs';
const fsPromises = fs.promises;


// rest of the code remains same
const app = express();
const PORT = 42424;

app.get('/tickets/', async (req, res) => {
    let mintFile = await fsPromises.readFile('mints.json', 'utf-8');
    if(mintFile){
        let mints = JSON.parse(mintFile);
        res.send(mints);
    }
});


app.listen(PORT, () => {
    console.log(`[server]: Server is running at https://localhost:${PORT}`);
});
