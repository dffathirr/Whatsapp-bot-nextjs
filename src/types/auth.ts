import { ApiParams, ApiResponse } from "./type";
import { JwtPayload } from "jsonwebtoken";

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

export interface AuthPayload extends JwtPayload {
  userId: number;
  nama: string;
  phone: string;
  nik: string | null;
}
