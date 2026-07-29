import { ApiParams, ApiResponse } from "./type";

export type AuthResponse = ApiResponse<{
  nama: string;
}>;

export type AuthParams = ApiParams<{
  no_hp: string;
}>;

export interface JWTParams {
  userId: number;
  nama: string;
  phone: string;
  nik?: string;
}
