/**
 * Big thanks to
 * https://github.com/solana-labs/explorer/
 * https://github.com/metaplex-foundation/metaplex
 * https://github.com/roederw/explorer/blob/roederw/nft-support
 * for the idea how to collect the data.
 */
import {decodeMetadata, METADATA_PREFIX} from "../metaplex/metadata";
import {METADATA_PROGRAM_ID, toPublicKey} from "../metaplex/ids";
import {
    ConfirmedSignaturesForAddress2Options,
    Connection,
    ParsedAccountData,
    ParsedInstruction,
    PublicKey
} from "@solana/web3.js";
import axios from "axios";
import {LotteryTicket} from "../models/lottery-ticket";
import {TraitModel} from "../models/trait.model";
import {MY_CANDY_MACHINE_ID} from "./constants";


export const getMetaDataFromMint = async (mintAddress: string, connection: Connection): Promise<LotteryTicket> => {
    console.log(mintAddress);

    const holders = await connection.getTokenLargestAccounts(new PublicKey(mintAddress));
    const holderAccount = holders.value.find(h => h.amount === '1');
    if (!holderAccount) {
        return {} as LotteryTicket;
    }

    const holderAccountInfo = await connection.getParsedAccountInfo(new PublicKey(holderAccount.address.toString()),
        'confirmed');

    if (!holderAccountInfo.value) {
        return {} as LotteryTicket;
    }

    const owner = (holderAccountInfo.value.data as ParsedAccountData).parsed.info.owner;

    // first get the account which holds the metadata for the mint
    const metaDataAccount = await findProgramAddress(
        [
            Buffer.from(METADATA_PREFIX),
            toPublicKey(METADATA_PROGRAM_ID).toBuffer(),
            toPublicKey(mintAddress).toBuffer(),
        ],
        toPublicKey(METADATA_PROGRAM_ID));

    // read account info from chain
    const accountInfo = await connection.getAccountInfo(new PublicKey(metaDataAccount[0]), 'confirmed');
    if (!accountInfo) {
        return {} as LotteryTicket;
    }
    // decode brosh ecoded meta data
    const metaData = decodeMetadata(Buffer.from(accountInfo.data));
    // get json from arewave
    const fullMetaData = await axios.get(metaData.data.uri);

    return {
        name: fullMetaData.data.name,
        img: fullMetaData.data.image,
        winMultiplier: {
            value: fullMetaData.data.attributes[0].value,
            rarity: 0,
            name: fullMetaData.data.attributes[0].trait_type,
        } as TraitModel,
        playMultiplier: {
            value: fullMetaData.data.attributes[1].value,
            rarity: 0,
            name: fullMetaData.data.attributes[1].trait_type,
        } as TraitModel,
        ticketType: {
            value: fullMetaData.data.attributes[2].value,
            rarity: 0,
            name: fullMetaData.data.attributes[2].trait_type,
        } as TraitModel,
        owner: owner,
        mint: mintAddress,
        rarityTotal: 0
    } as LotteryTicket;

}

export const findProgramAddress = async (
    seeds: (Buffer | Uint8Array)[],
    programId: PublicKey,
) => {
    const result = await PublicKey.findProgramAddress(seeds, programId);
    return [result[0].toBase58(), result[1]] as [string, number];
};

export const getAllMintedNfts = async (connection: Connection): Promise<string[]> => {

    let lastSignature = "";
    let options: ConfirmedSignaturesForAddress2Options;
    let mints = [];

    let finished = false;

    while (!finished) {

        if (lastSignature !== '') {
            options = {
                limit: 10,
                before: lastSignature
            };
        } else {
            options = {
                limit: 10,

            };
        }

        const fetched = await connection.getConfirmedSignaturesForAddress2(
            MY_CANDY_MACHINE_ID,
            options
        );

        if(fetched.length < 5){
            finished = true;
        }

        const signatures = fetched.map(f => f.signature);
        const txs = await connection.getParsedConfirmedTransactions(signatures, 'confirmed');

        lastSignature = signatures[signatures.length - 1];

        for (let tx in txs) {
            const accountInstruction = txs[tx]?.transaction.message.instructions[1] as ParsedInstruction;
            if (accountInstruction) {
                if (accountInstruction && accountInstruction.parsed.type === 'initializeMint') {
                    mints.push(accountInstruction.parsed.info.mint);
                }
            }
        }
        await snooze(1000);
    }

    return mints;
}

export const snooze = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
