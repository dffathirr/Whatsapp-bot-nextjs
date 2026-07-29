import { prisma } from "@/lib/prisma";
import { ApiError } from "@/helpers/api";

export async function addTransaction(
  walletId: number,
  userId: number,
  kdType: string,
  kdCategory: string,
  amount: number,
  transactionDate: Date,
  description?: string,
  transferWalletId?: number,
) {
  if (kdType === "TRX003" && !transferWalletId) {
    throw new ApiError(400, "transfer_wallet wajib diisi untuk transaksi transfer");
  }

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        walletId,
        userId,
        kdType,
        kdCategory,
        amount,
        transactionDate,
        description,
        transferWalletId,
      },
    });

    if (kdType === "TRX001" || kdType === "TRX004") {
      await tx.wallet.update({
        where: { id: walletId },
        data: { currentBalance: { increment: amount } },
      });
    } else if (kdType === "TRX002") {
      await tx.wallet.update({
        where: { id: walletId },
        data: { currentBalance: { decrement: amount } },
      });
    } else if (kdType === "TRX003" && transferWalletId) {
      await tx.wallet.update({
        where: { id: walletId },
        data: { currentBalance: { decrement: amount } },
      });
      await tx.wallet.update({
        where: { id: transferWalletId },
        data: { currentBalance: { increment: amount } },
      });
    }

    return transaction;
  });
}
