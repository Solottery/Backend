import {getMetaDataFromMint} from "./helpers/nft";
import {web3} from "@project-serum/anchor";

const nftAddress = '2Ls8EJiDE6qZHYRUFpm8Y9Ljq3XZ6teEWTApwahcfm7f';
const solConnection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));

const getInfo = async () => {
    const metadata = await getMetaDataFromMint(nftAddress, solConnection);
    console.log(metadata);
}

getInfo().then();
