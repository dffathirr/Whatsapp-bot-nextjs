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

export interface WalletBalanceItem {
  name: string;
  balance: number;
}

export interface BalanceSummaryPayload {
  userName?: string;
  wallets: WalletBalanceItem[];
  totalBalance: number;
  lastUpdated?: Date | string;
}

export type BotTransactionResult =
  | {
      status: "SUCCESS";
      transactionId: number;
      walletName: string;
      currentBalance: number;
      destinationWalletName?: string;
      destinationBalance?: number;
    }
  | {
      status: "MISSING_WALLET";
      missingWalletCode: string;
      missingWalletName: string;
    }
  | {
      status: "INSUFFICIENT_BALANCE";
      walletName: string;
      currentBalance: number;
      requiredAmount: number;
    };

