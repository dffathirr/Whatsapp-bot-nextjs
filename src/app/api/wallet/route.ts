import {
  addWallet,
  checkWallet,
  getWallet,
  updateWallet,
} from "@/controllers/wallet.controller";
import { ApiError } from "@/helpers/api";
import {
  ApiResponse,
  getBearerToken,
  getErrorMessage,
  verifyToken,
} from "@/helpers/site";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");

    const { userId } = verifyToken(token);
    const targetUserId = user_id ? Number(user_id) : userId;

    const res = await getWallet(targetUserId);

    return ApiResponse(200, "Success", res);
  } catch (error) {
    if (error instanceof ApiError) {
      return ApiResponse(error.status, error.message, null);
    }

    return ApiResponse(500, getErrorMessage(error), null);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const kd_type = formData.get("kd_type")?.toString();
    const name = formData.get("name")?.toString();
    const init_balance = formData.get("initial_balance")?.toString();
    const curr_balance = formData.get("current_balance")?.toString();

    const token = getBearerToken(request);
    const { userId } = verifyToken(token);

    if (!kd_type) {
      return ApiResponse(400, "kd_type wajib diisi", null);
    }

    if (!init_balance) {
      return ApiResponse(400, "init_balance wajib diisi", null);
    }

    const check = await checkWallet(userId, kd_type);

    if (check) {
      return ApiResponse(400, "Wallet sudah ditambahkan!", null);
    }

    const res = await addWallet(
      userId,
      kd_type,
      name ?? "",
      Number(init_balance),
      Number(curr_balance ?? init_balance),
    );
    return ApiResponse(201, "Success", res);
  } catch (error) {
    if (error instanceof ApiError) {
      return ApiResponse(error.status, error.message, null);
    }

    return ApiResponse(500, getErrorMessage(error), null);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const kd_type = formData.get("kd_type")?.toString();
    const curr_balance = formData.get("current_balance")?.toString();
    const init_balance = formData.get("initial_balance")?.toString();

    const token = getBearerToken(request);
    const { userId } = verifyToken(token);

    if (!kd_type) {
      return ApiResponse(400, "kd_type wajib diisi", null);
    }

    if (!curr_balance) {
      return ApiResponse(400, "current_balance wajib diisi", null);
    }

    const check = await checkWallet(userId, kd_type);

    if (!check) {
      return ApiResponse(404, "Wallet tidak ditemukan!", null);
    }

    const res = await updateWallet(
      userId,
      kd_type,
      Number(curr_balance),
      init_balance ? Number(init_balance) : undefined,
    );

    return ApiResponse(200, "Success", res);
  } catch (error) {
    if (error instanceof ApiError) {
      return ApiResponse(error.status, error.message, null);
    }

    return ApiResponse(500, getErrorMessage(error), null);
  }
}
