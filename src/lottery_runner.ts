import fs from "fs";
import {LotteryEntry, LotteryModel} from "./models/LotteryModel";
import {LotteryTicket} from "./models/lottery-ticket";
const fsPromises = fs.promises;
import crypto from "crypto";
import arrayShuffle from 'array-shuffle';
import {Keypair, PublicKey} from "@solana/web3.js";
import {web3} from "@project-serum/anchor";

// Thanks @metaplex
export function loadWalletKey(keypair: string): Keypair {
    return Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())),
    );
}

const sendSol = async (amount: number, winningTicket: LotteryEntry) =>  {
    const jackPotWallet = loadWalletKey('./lottery_data/jackpot_wallet.json')

    let transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: jackPotWallet.publicKey,
            toPubkey: new PublicKey(winningTicket.owner),
            lamports: web3.LAMPORTS_PER_SOL * amount,
        }),
    );
    const solConnection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));

    // Sign transaction, broadcast, and confirm
    let signature = await web3.sendAndConfirmTransaction(
        solConnection,
        transaction,
        [jackPotWallet],
    );
}

const run_lottery = async () => {
    let lotteriesData = await fsPromises.readFile('./lottery_data/lotteries.json', 'utf-8');
    if(lotteriesData){
        const lotteries = JSON.parse(lotteriesData) as LotteryModel[];
        const runningLotteries = lotteries.filter(l => !l.finished)
        runningLotteries.sort((l1, l2) => {
            if (l1.time < l2.time) {
                return -1;
            }
            if (l1.time > l2.time) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });

        // if its time for the snapshot
        if(runningLotteries[0].time <= (new Date(Date.now() - 1000 * 60))){
            await fsPromises.copyFile('mints_details.json', '/lottery_data/' + runningLotteries[0].id);
        }

        // lottery time
        if(runningLotteries[0].time <= new Date()){
            let mintFile = await fsPromises.readFile('mints_details.json', 'utf-8');
            if(mintFile){
                const tickets = JSON.parse(mintFile) as LotteryTicket[];
                const lotteryList = [];
                // create lottery list with tickets
                for(let ticket in tickets){
                    let ticketInfo = tickets[ticket]
                    for(let i = 0; i++; i < Number(ticketInfo.playMultiplier.value)){
                        lotteryList.push({
                            owner: ticketInfo.owner,
                            ticket: ticketInfo.mint,
                            winMultiplier: Number(ticketInfo.winMultiplier.value)
                        } as LotteryEntry)
                    }
                }

                // shuffle list with random number
                const randomList = arrayShuffle(lotteryList);
                const winningIndex = crypto.randomInt(0, randomList.length - 1);
                const winningTicket = randomList[winningIndex];




            }
        }

    }
}


