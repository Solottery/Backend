import {getMetaDataFromMint, snooze} from "./helpers/nft";
import {web3} from "@project-serum/anchor";
import * as fs from 'fs';

const fsPromises = fs.promises;


const collectDetailOfMints = async () => {
    const solConnection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));
    try {
        let savedMintsFile = await fsPromises.readFile('mints.json', 'utf-8');
        let mints = JSON.parse(savedMintsFile);
        let mintInfos = [];

        let playMultipliers = new Map<number, number>();
        let winMultipliers = new Map<number, number>();
        let ticketTypes = new Map<string, number>();

        for (let mint in mints) {
            let mintInfo = await getMetaDataFromMint(mints[mint], solConnection);
            mintInfos.push(mintInfo);

            const play = Number(mintInfo.playMultiplier.value);
            playMultipliers.set(play, (playMultipliers.get(play) ?? 0) + 1);

            const win = Number(mintInfo.winMultiplier.value);
            winMultipliers.set(win, (winMultipliers.get(win) ?? 0) + 1);

            const type = mintInfo.ticketType.value;
            ticketTypes.set(type, (ticketTypes.get(type) ?? 0) + 1);

            await snooze(1000);
        }

        // evaluate rarity ranking
        for (let i in mintInfos) {

            mintInfos[i].ticketType.rarity = (ticketTypes.get(mintInfos[i].ticketType.value) ?? 0) /
                (mintInfos.length / 100);

            mintInfos[i].winMultiplier.rarity = (winMultipliers.get(Number(mintInfos[i].winMultiplier.value)) ?? 0) /
                (mintInfos.length / 100);

            mintInfos[i].playMultiplier.rarity = (playMultipliers.get(Number(mintInfos[i].playMultiplier.value)) ?? 0) /
                (mintInfos.length / 100);

            mintInfos[i].rarityTotal = (mintInfos[i].ticketType.rarity / 100) *
                (mintInfos[i].playMultiplier.rarity / 100) *
                (mintInfos[i].winMultiplier.rarity / 100);
        }

        mintInfos.sort(function(a, b) {
            return a.rarityTotal - b.rarityTotal;
        });

        for(let i in mintInfos){
            mintInfos[i].rarityRank = Number(i) + 1;
        }

        let data = JSON.stringify(mintInfos, null, 2);
        fs.writeFile('mints_details.json', data, (err) => {
            if (err) throw err;
            console.log('Data written to file');
        });

    } catch (e) {
        console.log(e);
        return;
    }
}


collectDetailOfMints().then(() => {
    console.log("Collected");
});

