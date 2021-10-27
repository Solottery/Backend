import {getAllMintedNfts} from "./helpers/nft";
import {web3} from "@project-serum/anchor";
import * as fs from 'fs';
import {getCandyMachineState} from "./helpers/candy-machine";
import * as cron from 'node-cron';

const fsPromises = fs.promises;


const collectCandyMachineMints = async () => {
    const solConnection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));

    let savedAmount = 0;
    try{
        let savedMintsFile = await fsPromises.readFile('mints.json', 'utf-8');
        let savedMints = JSON.parse(savedMintsFile);
        savedAmount = savedMints.length;
    }catch {
        savedAmount = 0;
    }

    let presale_mint_file = await fsPromises.readFile('presale_mints.json', 'utf-8');
    let presale_mints = JSON.parse(presale_mint_file);

    let state = await getCandyMachineState(solConnection);
    if(state.itemsRedeemed > savedAmount - (presale_mints.length)){

        let result = await getAllMintedNfts(solConnection);
        result = result.concat(presale_mints);
        let data = JSON.stringify(result, null, 2);
        fs.writeFile('mints.json', data, (err) => {
            if (err) throw err;
            console.log('Data written to file');
        });
    }
}

cron.schedule('*/10 * * * *', function(){
    collectCandyMachineMints().then(() => {
        console.log("Collected");
    });
});
