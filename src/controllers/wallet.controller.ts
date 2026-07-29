import { prisma } from "@/lib/prisma";

export async function getWallet(id: number) {
  return await prisma.wallet.findMany({
    where: {
      userId: id,
    },
  });
}

export async function checkWallet(id: number, kd_type: string) {
  return await prisma.wallet.findFirst({
    where: {
      userId: id,
      kdType: kd_type,
    },
  });
}

export async function addWallet(
  user_id: number,
  kd_type: string,
  name: string,
  init_balance: number,
  curr_balance: number,
) {
  return prisma.wallet.create({
    data: {
      userId: user_id,
      kdType: kd_type,
      name,
      initialBalance: init_balance,
      currentBalance: curr_balance,
    },
  });
}

export async function updateWallet(
  user_id: number,
  kd_type: string,
  curr_balance: number,
  init_balance?: number,
) {
  const wallet = await checkWallet(user_id, kd_type);
  if (!wallet) throw new Error("Wallet not found");

  return prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      currentBalance: curr_balance,
      ...(init_balance !== undefined && { initialBalance: init_balance }),
    },
  });
}
