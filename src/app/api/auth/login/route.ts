import { getUser } from "@/controllers/auth.controller";
import { ApiError } from "@/helpers/api";
import { ApiResponse, generateToken, getErrorMessage } from "@/helpers/site";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const no_hp = formData.get("no_hp")?.toString();

    if (!no_hp) {
      return ApiResponse(400, "no_hp wajib diisi", null);
    }

    const user = await getUser(no_hp);

    if (!user) {
      return ApiResponse(404, "User tidak ditemukan", null);
    }

    const data = {
      ...user,
      ...generateToken({ nama: user.name, phone: no_hp, userId: user.id }),
    };

    return ApiResponse(200, "Success", data);
  } catch (error) {
    if (error instanceof ApiError) {
      return ApiResponse(error.status, error.message, null);
    }

    return ApiResponse(500, getErrorMessage(error), null);
  }
}
