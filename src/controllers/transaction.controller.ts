import { prisma } from "@/lib/prisma";
import { ApiError } from "@/helpers/api";
import { checkWallet } from "./wallet.controller";
import { getRefNameByCode, WALLET_REF } from "@/types/ai";
import { BotTransactionResult } from "@/types/baileys";

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
    throw new ApiError(
      400,
      "transfer_wallet wajib diisi untuk transaksi transfer",
    );
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

export async function addTransactionBot(
  walletCode: string,
  userId: number,
  kdType: string,
  kdCategory: string,
  amount: number,
  transactionDate: string,
  description?: string,
  transferWalletCode?: string,
): Promise<BotTransactionResult> {
  if (kdType === "TRX003" && !transferWalletCode) {
    throw new ApiError(
      400,
      "transfer_wallet wajib diisi untuk transaksi transfer",
    );
  }

  // 1. Cek apakah dompet asal milik user sudah terdaftar di DB
  const wallet = await checkWallet(userId, walletCode);
  if (!wallet) {
    const walletName = getRefNameByCode(WALLET_REF, walletCode) ?? walletCode;
    return {
      status: "MISSING_WALLET",
      missingWalletCode: walletCode,
      missingWalletName: walletName,
    };
  }

  // 2. Jika transaksi TRANSFER (TRX003), cek juga dompet tujuan
  let destWallet = null;
  if (kdType === "TRX003" && transferWalletCode) {
    destWallet = await checkWallet(userId, transferWalletCode);
    if (!destWallet) {
      const destName =
        getRefNameByCode(WALLET_REF, transferWalletCode) ?? transferWalletCode;
      return {
        status: "MISSING_WALLET",
        missingWalletCode: transferWalletCode,
        missingWalletName: destName,
      };
    }
  }

  // 3. Strict Balance Check untuk Pengeluaran (TRX002) & Transfer (TRX003)
  const currentBalanceNum = Number(wallet.currentBalance);
  if (
    (kdType === "TRX002" || kdType === "TRX003") &&
    currentBalanceNum < amount
  ) {
    return {
      status: "INSUFFICIENT_BALANCE",
      walletName: wallet.name,
      currentBalance: currentBalanceNum,
      requiredAmount: amount,
    };
  }

  // 4. Parse tanggal transaksi dengan aman (fallback ke waktu sekarang jika tidak valid)
  const parsedDate = transactionDate ? new Date(transactionDate) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  // 5. Mutasi Atomik di Database menggunakan prisma.$transaction
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        kdType,
        kdCategory,
        amount,
        transactionDate: validDate,
        description,
        transferWalletId: destWallet?.id,
      },
    });

    let updatedSource = wallet;
    let updatedDest = destWallet;

    if (kdType === "TRX001" || kdType === "TRX004") {
      // Pemasukan (/add) atau Adjustment menambah saldo
      updatedSource = await tx.wallet.update({
        where: { id: wallet.id },
        data: { currentBalance: { increment: amount } },
      });
    } else if (kdType === "TRX002") {
      // Pengeluaran (/buy) mengurangi saldo
      updatedSource = await tx.wallet.update({
        where: { id: wallet.id },
        data: { currentBalance: { decrement: amount } },
      });
    } else if (kdType === "TRX003" && destWallet) {
      // Transfer (/tf) mengurangi dompet asal & menambah dompet tujuan
      updatedSource = await tx.wallet.update({
        where: { id: wallet.id },
        data: { currentBalance: { decrement: amount } },
      });
      updatedDest = await tx.wallet.update({
        where: { id: destWallet.id },
        data: { currentBalance: { increment: amount } },
      });
    }

    return {
      status: "SUCCESS",
      transactionId: transaction.id,
      walletName: updatedSource.name,
      currentBalance: Number(updatedSource.currentBalance),
      destinationWalletName: updatedDest?.name,
      destinationBalance: updatedDest
        ? Number(updatedDest.currentBalance)
        : undefined,
    };
  });
}
