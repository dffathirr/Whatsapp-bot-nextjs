import { addUser, getUser } from "@/controllers/auth.controller";
import { ApiResponse, getErrorMessage } from "@/helpers/site";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const no_hp = formData.get("no_hp")?.toString();
    const nama = formData.get("nama")?.toString();
    const nik = formData.get("nik")?.toString();

    if (!no_hp) {
      return ApiResponse(400, "no_hp wajib diisi!", null);
    }

    if (!nama) {
      return ApiResponse(400, "nama wajib diisi!", null);
    }

    const user = await getUser(no_hp);

    if (user) {
      return ApiResponse(400, "no_hp sudah digunakan!", null);
    }

    const res = await addUser(no_hp, nama, nik ?? "");

    return ApiResponse(201, "Success", res);
  } catch (error) {
    return ApiResponse(500, getErrorMessage(error), null);
  }
}
