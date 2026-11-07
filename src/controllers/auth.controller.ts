import { prisma } from "@/lib/prisma";

export async function getUser(phone: string) {
  return prisma.user.findUnique({
    where: {
      phone,
    },
  });
}

export async function addUser(
  phone: string,
  name: string,
  nik?: string,
  currency: string = "IDR",
) {
  return prisma.user.create({
    data: {
      name,
      phone,
      nik: nik || null,
      currency: currency || "IDR",
      wallets: {
        create: {
          kdWallet: "WAL001",
          name: "Tunai",
          initialBalance: 0,
          currentBalance: 0,
        },
      },
    },
    include: {
      wallets: true,
    },
  });
}
