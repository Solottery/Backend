/**
 * Includes code form https://github.com/solana-labs/solana-program-library/blob/master/token/js/examples/create_mint_and_transfer_tokens.js
 * and Metaplex.
 */

import fs from "fs";
import {LotteryEntry, LotteryModel, LotteryResult, WinningAssets} from "./models/LotteryModel";
import {LotteryTicket} from "./models/lottery-ticket";
import crypto from "crypto";
import {Keypair, PublicKey} from "@solana/web3.js";
import {web3} from "@project-serum/anchor";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";

const fsPromises = fs.promises;


const NETWORK = "devnet";

const shuffleArray = (array: any[]): any => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}


// Thanks @metaplex
export function loadWalletKey(keypair: string): Keypair {
    return Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())),
    );
}

const sendSol = async (amount: number, winningTicket: LotteryEntry): Promise<string> => {
    const jackPotWallet = loadWalletKey('./lottery_data/jackpot_wallet.json')

    let transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: jackPotWallet.publicKey,
            toPubkey: new PublicKey(winningTicket.owner),
            lamports: web3.LAMPORTS_PER_SOL * amount,
        }),
    );
    const solConnection = new web3.Connection(web3.clusterApiUrl(NETWORK));

    // Sign transaction, broadcast, and confirm
    let signature = await web3.sendAndConfirmTransaction(
        solConnection,
        transaction,
        [jackPotWallet],
    );

    return signature;
}


const sendSPLToken = async (tokenAddress: string, winningTicket: LotteryEntry, amount: number): Promise<string> => {
    try {

        const jackPotWallet = loadWalletKey('./lottery_data/jackpot_wallet.json')
        const winner = new PublicKey(winningTicket.owner);
        const solConnection = new web3.Connection(web3.clusterApiUrl(NETWORK));

        //get the token account of the toWallet Solana address, if it does not exist, create it
        const token = new Token(solConnection, new PublicKey(tokenAddress), TOKEN_PROGRAM_ID, jackPotWallet);
        const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
            winner,
        );
        const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
            jackPotWallet.publicKey,
        );
        const signature = await token.transfer(fromTokenAccount.address, toTokenAccount.address, jackPotWallet, [], web3.LAMPORTS_PER_SOL * amount);

        // // Add token transfer instructions to transaction
        // const transaction = new web3.Transaction().add(
        //     Token.createTransferInstruction(
        //         TOKEN_PROGRAM_ID,
        //         fromTokenAccount.address,
        //         toTokenAccount.address,
        //         winner,
        //         [],
        //         amount,
        //     ),
        // );
        //
        //
        // // Sign transaction, broadcast, and confirm
        // const signature = await web3.sendAndConfirmTransaction(
        //     solConnection,
        //     transaction,
        //     [jackPotWallet],
        //     {commitment: 'confirmed'},
        // );

        return signature;
    } catch (e) {
        console.log(e);
        return "";
    }
}

const run_lottery = async () => {
    let lotteriesData = await fsPromises.readFile('./lottery_data/lotteries.json', 'utf-8');
    if (lotteriesData) {
        const lotteries = JSON.parse(lotteriesData).lotteries as LotteryModel[];
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

        const lottery_data_path = './lottery_data/' + runningLotteries[0].id + "/";
        // if its time for the snapshot
        if (new Date(runningLotteries[0].time) <= (new Date(Date.now() - 1000 * 60))) {
            await fsPromises.mkdir(lottery_data_path);
            await fsPromises.copyFile('mints_details.json', lottery_data_path + 'mints_details.json');
        }

        // lottery time
        if (new Date(runningLotteries[0].time) <= new Date()) {
            let mintFile = await fsPromises.readFile(lottery_data_path + 'mints_details.json', 'utf-8');
            if (mintFile) {
                const tickets = JSON.parse(mintFile) as LotteryTicket[];
                const lotteryList = [];
                // create lottery list with tickets
                for (let ticket in tickets) {
                    let ticketInfo = tickets[ticket]
                    for (let i = 0; i < Number(ticketInfo.playMultiplier.value); i++) {
                        lotteryList.push({
                            owner: ticketInfo.owner,
                            ticket: ticketInfo.mint,
                            winMultiplier: Number(ticketInfo.winMultiplier.value)
                        } as LotteryEntry)
                    }
                }

                // shuffle list with random number
                const randomList = shuffleArray(lotteryList);
                const winningIndex = crypto.randomInt(0, randomList.length - 1);
                const winningTicket = randomList[winningIndex];

                const winnings = runningLotteries[0].assets;

                const winAssets: WinningAssets[] = [];
                for (let i in winnings) {
                    const win = winnings[i];
                    if (win.sol) {
                        const amount = Number(winningTicket.winMultiplier) * Number(win.amount);
                        const sign = await sendSol(amount, winningTicket);
                        winAssets.push({
                            website: win.website,
                            amount: amount,
                            name: win.name,
                            tx: sign
                        } as WinningAssets);
                    } else if (win.nft) {
                        const sign = await sendSPLToken(win.address, winningTicket, 1);
                        winAssets.push({
                            website: win.website,
                            amount: 1,
                            name: win.name,
                            tx: sign
                        } as WinningAssets);
                    } else {
                        const amount = Number(winningTicket.winMultiplier) * Number(win.amount);
                        const sign = await sendSPLToken(win.address, winningTicket, amount);
                        winAssets.push({
                            website: win.website,
                            amount: amount,
                            name: win.name,
                            tx: sign
                        } as WinningAssets);
                    }
                }


                const result = {
                    winner: winningTicket.owner,
                    ticket: winningTicket.ticket,
                    assets: winAssets
                } as LotteryResult;

                fs.writeFileSync(lottery_data_path + 'winner.json', JSON.stringify(result))
            }
        }

    }
}


run_lottery().then(r => console.log("fertig"));
