export interface IncomingMessage {
  id?: string;
  jid?: string;
  fromNumber?: string;
  fromName: string;
  type: string;
  text: string;
}

export type ParsedCommand = {
  command: string;
  args: string[];
  raw: string;
};

export interface TransactionPayload {
  type: "EXPENSE" | "INCOME" | "TRANSFER" | "ADJUSTMENT";
  amount: number;
  category?: string;
  walletName: string;
  currentBalance?: number;
  destinationWalletName?: string;
  destinationBalance?: number;
  description: string;
  date?: Date | string;
  merchantName?: string;
}
