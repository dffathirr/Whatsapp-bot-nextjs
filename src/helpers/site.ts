import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { AuthPayload, JWTParams } from "@/types/auth";
import { serverEnv } from "@/configs/server.env";
import { ApiError } from "./api";

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

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, serverEnv.JWT_SECRET) as AuthPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token telah kedaluwarsa");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Token tidak valid");
    }

    throw error;
  }
}

export function getBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    throw new ApiError(401, "Authorization header tidak ditemukan");
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer") {
    throw new ApiError(401, "Authorization scheme harus Bearer");
  }

  if (!token) {
    throw new ApiError(401, "Token tidak ditemukan");
  }

  return token;
}

export function generateSearchParams(
  params:
    | {
        key: string;
        value: string | number;
        validator?: boolean;
      }[]
    | Record<string, string | number | undefined>,
) {
  const entries: [string, string][] = [];

  if (Array.isArray(params)) {
    for (const { key, value, validator } of params) {
      // Default validator, check if value is valid
      if (typeof validator === "undefined") {
        if (!!value) {
          entries.push([key, value.toString()]);
        }
      }

      // Using self validator
      if (validator) {
        entries.push([key, value.toString()]);
      }
    }
  } else {
    // If user pass object, loop and check if value is valid string before appending to searchParams
    for (const [key, value] of Object.entries(params)) {
      if (!!value) {
        entries.push([key, value.toString()]);
      }
    }
  }

  // Urutkan entries berdasarkan key
  entries.sort(([a], [b]) => a.localeCompare(b));

  const searchParams = new URLSearchParams(entries);

  return searchParams.toString();
}
