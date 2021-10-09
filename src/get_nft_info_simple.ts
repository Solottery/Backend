import {getMetaDataFromMint} from "./helpers/nft";
import {web3} from "@project-serum/anchor";

const nftAddress = '9F7U1hukWjsgjzXKahgd5gxE5ysq3nRuF3q3moMeeUzN';
const solConnection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));

const getInfo = async () => {
    const metadata = await getMetaDataFromMint(nftAddress, solConnection);
    console.log(metadata);
}

getInfo().then();
