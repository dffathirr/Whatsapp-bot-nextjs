import { addTransaction } from "@/controllers/transaction.controller";
import { ApiError } from "@/helpers/api";
import { ApiResponse, getBearerToken, getErrorMessage, verifyToken } from "@/helpers/site";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const walletId = formData.get("wallet_id")?.toString();
    const kdType = formData.get("kd_type")?.toString();
    const kdCategory = formData.get("kd_category")?.toString();
    const amount = formData.get("amount")?.toString();
    const description = formData.get("description")?.toString();
    const transferWalletId = formData.get("transfer_wallet")?.toString();
    const transactionDate = formData.get("transaction_date")?.toString();

    const token = getBearerToken(request);
    const { userId } = verifyToken(token);

    if (!walletId) return ApiResponse(400, "wallet_id wajib diisi", null);
    if (!kdType) return ApiResponse(400, "kd_type wajib diisi", null);
    if (!kdCategory) return ApiResponse(400, "kd_category wajib diisi", null);
    if (!amount) return ApiResponse(400, "amount wajib diisi", null);

    if (kdType === "TRX003" && !transferWalletId) {
      return ApiResponse(400, "transfer_wallet wajib diisi untuk transaksi transfer", null);
    }

    const res = await addTransaction(
      Number(walletId),
      userId,
      kdType,
      kdCategory,
      Number(amount),
      transactionDate ? new Date(transactionDate) : new Date(),
      description,
      transferWalletId ? Number(transferWalletId) : undefined,
    );

    return ApiResponse(201, "Success", res);
  } catch (error) {
    if (error instanceof ApiError) {
      return ApiResponse(error.status, error.message, null);
    }
    return ApiResponse(500, getErrorMessage(error), null);
  }
}
