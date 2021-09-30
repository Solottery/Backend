import * as fs from 'fs';
import {LotteryTicket} from "../models/lottery-ticket";

const fsPromises = fs.promises;

function onlyUnique(value: any, index: number, self: any) {
    return self.indexOf(value) === index;
}


export const getUniqueOwners = async (): Promise<OwnerModel[]> => {
    let mintFile = await fsPromises.readFile('mints_details.json', 'utf-8');
    if (mintFile) {
        const owners = new Map<string, OwnerModel>();
        const mints = JSON.parse(mintFile) as LotteryTicket[];

        for (let i in mints) {
            let owner = mints[i].owner;
            if (owners.has(owner)) {
                let ownerInfo = owners.get(owner) ?? {} as OwnerModel;
                ownerInfo.tickets += 1;
                ownerInfo.ticket_weight += Number(mints[i].playMultiplier.value);
                ownerInfo.ticket_list.push(mints[i]);
                owners.set(owner, ownerInfo)
            } else {
                let ownerInfo = {} as OwnerModel;
                ownerInfo.address = owner;
                ownerInfo.tickets = 1;
                ownerInfo.ticket_weight = Number(mints[i].playMultiplier.value);
                ownerInfo.ticket_list = [];
                ownerInfo.ticket_list.push(mints[i]);
                owners.set(owner, ownerInfo)
            }
        }
        let ownersList = Array.from(owners.values());

        ownersList.sort(function (a, b) {
            return b.ticket_weight - a.ticket_weight;
        });

        for (let i in ownersList) {
            ownersList[i].weight_rank = Number(i) + 1;
        }

        ownersList.sort(function (a, b) {
            return b.tickets - a.tickets;
        });

        for (let i in ownersList) {
            ownersList[i].holder_rank = Number(i) + 1;
        }

        return ownersList;
    }

    return [];
}


export interface OwnerModel {
    address: string;
    tickets: number;
    ticket_weight: number;
    ticket_list: LotteryTicket[];
    holder_rank: number;
    weight_rank: number;
}
