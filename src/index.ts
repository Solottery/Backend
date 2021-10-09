import express from 'express';
import * as fs from 'fs';
import {getUniqueOwners} from "./helpers/owner";
import {LotteryModel} from "./models/LotteryModel";
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

// get all lottery by id or list
app.get('/lotteries/', async (req, res) => {
    let lotteriesFile = await fsPromises.readFile('lottery_data/lotteries.json', 'utf-8');
    if(lotteriesFile){
        let lotteries = JSON.parse(lotteriesFile)?.lotteries as LotteryModel[]
        if(req.query.id){
            const lottery = lotteries.filter(l => l.id === Number(req.query.id));
            res.send(lottery);
        }else{
            res.send(lotteries);
        }
    }
});

app.get('/lotteries/list', async (req, res) => {
    if(req.query.id){
        try{
            let ticketList = await fsPromises.readFile('lottery_data/' + req.query.id + '/mints_details.json', 'utf-8');
            res.send(ticketList);
        }catch (e){
            res.send({})
        }
    }else{
        res.send({})
    }
});

app.get('/lotteries/winner', async (req, res) => {
    if(req.query.id){
        try{
            let winner = await fsPromises.readFile('lottery_data/' + req.query.id + '/winner.json', 'utf-8');
            res.send(winner);
        }catch (e){
            res.send({})
        }
    }else{
        res.send({})
    }
});

app.listen(PORT, () => {
    console.log(`[server]: Server is running at https://localhost:${PORT}`);
});
