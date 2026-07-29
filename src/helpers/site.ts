import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { JWTParams } from "@/types/auth";
import { serverEnv } from "@/configs/server.env";

export function ApiResponse<T>(status: number, message: string, data?: T) {
  return NextResponse.json(
    { status, message, data },
    {
      status,
    },
  );
}

export function getErrorMessage(error: unknown): string {
  let message: string = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "Something went wrong!";
  }
  return message;
}

export function generateToken({ userId, nama, phone, nik }: JWTParams) {
  const token = jwt.sign(
    { userId, phone, nama, nik: nik || null },
    serverEnv.JWT_SECRET,
    {
      expiresIn: serverEnv.JWT_EXPIRED,
    },
  );

  const decoded = jwt.decode(token) as jwt.JwtPayload;

  return {
    token,
    expired_date: decoded.exp ? new Date(decoded.exp * 1000) : null,
  };
}

export function verifyToken(token: string) {
  return jwt.verify(token, serverEnv.JWT_SECRET!);
}
