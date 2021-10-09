
export interface LotteryModel {
    id: number;
    name: string;
    time: Date;
    assets: AssetModel[];
    description: string;
    finished: boolean;
    winner: LotteryResult;
}

export interface AssetModel {
    address: string;
    amount: number;
    sol: boolean;
    nft: boolean;
    name: string;
    website: string;
    preview: string;
}

export interface LotteryEntry {
    owner: string;
    ticket: string;
    ticketUrl: string;
    ticketNumber: string;
    winMultiplier: number;
}

export interface LotteryResult {
    winner: string;
    ticket: string;
    ticketUrl: string;
    ticketNumber: string;
    assets: []
}

export interface WinningAssets {
    name: string;
    tx: string;
    amount: number;
    website: string;
    preview: string;
}
