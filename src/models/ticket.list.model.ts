import {LotteryTicket} from "./lottery-ticket";

export interface TicketListModel {
    tickets: Map<string, LotteryTicket>;
    amount: number;
    lastSignature: string;
}

export interface SerializableTicketList {
    tickets: [];
    amount: number;
    lastSignature: string;
}
