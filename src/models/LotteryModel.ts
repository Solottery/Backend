
export interface LotteryModel {
    id: number;
    name: string;
    time: string;
    assets: AssetModel[];
    finished: boolean;
}

export interface AssetModel {
    address: string;
    amount: number;
    sol: boolean;
    nft: boolean;
    name: string;
    website: string;
}

export interface LotteryEntry {
    owner: string;
    ticket: string;
    winMultiplier: number;
}

export interface LotteryResult {
    winner: string;
    ticket: string;
    assets: []
}

export interface WinningAssets {
    name: string;
    tx: string;
    amount: number;
    website: string;
}
