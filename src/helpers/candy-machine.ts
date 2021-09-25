/**
 * Code used form exiled apes
 * https://github.com/exiled-apes/candy-machine-mint
 * Big thanks
 */

import * as anchor from "@project-serum/anchor";
import {CANDY_MACHINE_PROGRAM_ID, MY_CANDY_MACHINE_ID, TICKETS_STORAGE_KEY} from "./constants";
import {ConfirmedSignaturesForAddress2Options, Keypair, ParsedInstruction, PublicKey} from "@solana/web3.js";
import {getMetaDataFromMint} from "./nft";
import {SerializableTicketList, TicketListModel} from "../models/ticket.list.model";
import {LotteryTicket} from "../models/lottery-ticket";
import {Wallet} from "@project-serum/anchor";

export interface CandyMachine {
    id: anchor.web3.PublicKey,
    connection: anchor.web3.Connection;
    program: anchor.Program;
}

interface CandyMachineState {
    candyMachine: CandyMachine;
    itemsAvailable: number;
    itemsRedeemed: number;
    itemsRemaining: number;
    goLiveDate: Date,
}


export const getCandyMachineState = async (
    connection: anchor.web3.Connection
): Promise<CandyMachineState> => {

    // no real wallet because we are only reading here
    const provider = new anchor.Provider(connection, new Wallet(new Keypair()), {
        preflightCommitment: "recent",
    });

    const idl = await anchor.Program.fetchIdl(
        CANDY_MACHINE_PROGRAM_ID,
        provider
    );

    if(!idl){
        return {} as CandyMachineState;
    }

    const program = new anchor.Program(idl, CANDY_MACHINE_PROGRAM_ID, provider);
    const candyMachine = {
        id: MY_CANDY_MACHINE_ID,
        connection,
        program,
    }

    const state: any = await program.account.candyMachine.fetch(MY_CANDY_MACHINE_ID);

    const itemsAvailable = state.data.itemsAvailable.toNumber();
    const itemsRedeemed = state.itemsRedeemed.toNumber();
    const itemsRemaining = itemsAvailable - itemsRedeemed;

    let goLiveDate = state.data.goLiveDate.toNumber();
    goLiveDate = new Date(goLiveDate * 1000);

    return {
        candyMachine,
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining,
        goLiveDate,
    };
}

// export const getAllMintedTickets = async (connection: anchor.web3.Connection,
//                                           anchorWallet: anchor.Wallet): Promise<TicketListModel> => {
//
//     const candyMachineInfo = await getCandyMachineState(anchorWallet, connection);
//     // const cachedTickets = await Storage.get({key: TICKETS_STORAGE_KEY});
//
//     let list: TicketListModel;
//
//     if(cachedTickets.value){
//         const cachedList = JSON.parse(cachedTickets.value) as SerializableTicketList;
//         list = {
//             tickets: new Map(cachedList.tickets),
//             amount: cachedList.amount,
//             lastSignature: cachedList.lastSignature
//         } as TicketListModel;
//
//         if(cachedList.amount == candyMachineInfo.itemsRedeemed){
//             return list;
//         }else{
//             list = await updateTicketList(connection, cachedList.lastSignature, list.tickets);
//         }
//     }else{
//         list = await updateTicketList(connection, '', new Map<string, LotteryTicket>());
//     }
//
//     // await Storage.set({
//     //     key: TICKETS_STORAGE_KEY,
//     //     value: JSON.stringify({
//     //         tickets: Array.from(list.tickets.entries()),
//     //         amount: list.amount,
//     //         lastSignature: list.lastSignature
//     //     } as SerializableTicketList)
//     // });
//     console.log(list.amount);
//
//     return list;
//
// }

// const updateTicketList = async (connection: anchor.web3.Connection,
//                                 lastSignature: string,
//                                 ticketList: Map<string, LotteryTicket>): Promise<TicketListModel> => {
//
//     let options: ConfirmedSignaturesForAddress2Options;
//
//     if(lastSignature !== ''){
//         options =  {
//             limit: 5,
//             before: lastSignature
//         };
//     }else{
//         options =  {
//             limit: 5,
//
//         };
//     }
//
//     const fetched = await connection.getConfirmedSignaturesForAddress2(
//         MY_CANDY_MACHINE_ID,
//         options
//     );
//
//     const signatures = fetched.map(f => f.signature);
//
//     const txs = await connection.getParsedConfirmedTransactions(signatures, 'confirmed');
//
//     lastSignature = signatures[signatures.length - 1];
//
//     for(let tx in txs){
//         const accountInstruction = txs[tx]?.transaction.message.instructions[1] as ParsedInstruction;
//         if(accountInstruction){
//             if(accountInstruction && accountInstruction.parsed.type === 'initializeMint'){
//                 const mint = accountInstruction.parsed.info.mint;
//                 const mintData = await getMetaDataFromMint(mint, connection);
//                 ticketList.set(mintData.name, mintData);
//             }
//         }
//         await sleep(2000);
//     }
//
//     return {
//         amount: ticketList.size,
//         tickets: ticketList,
//         lastSignature: lastSignature
//     } as TicketListModel
// }
