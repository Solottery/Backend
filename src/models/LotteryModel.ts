
export interface LotteryModel {
    id: number;
    name: string;
    time: Date;
    assets: AssetModel[];
    finished: boolean;
}

export interface AssetModel {
    address: string;
    amount: string;
    isSol: boolean;
}

export interface LotteryEntry {
    owner: string;
    ticket: string;
    winMultiplier: number;
}
