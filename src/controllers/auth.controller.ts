import { getErrorMessage } from "@/helpers/site";
import { prisma } from "@/lib/prisma";
import { AuthParams } from "@/types/auth";

export async function getUser(phone: string) {
  return prisma.user.findUnique({
    where: {
      phone,
    },
  });
}

export async function addUser(phone: string, name: string, nik?: string) {
  return prisma.user.create({
    data: {
      name,
      phone,
      nik: nik || null,
      currency: "IDR",
    },
  });
}
