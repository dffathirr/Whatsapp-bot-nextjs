import { IncomingMessage } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { parseCommand } from "./parser";
import LoginCommand from "./commands/login.command";
import {
  ResponseMessage,
  sendBalanceSummary,
  sendFailedMessage,
  sendGreeting,
  sendHelp,
  sendTransaction,
} from "./response";
import { ParseAi } from "@/configs/ai";
import { addTransactionBot } from "@/controllers/transaction.controller";
import { getUser } from "@/controllers/auth.controller";
import { getWallet } from "@/controllers/wallet.controller";
import { CATEGORY_REF, getRefCode, TYPE_REF, WALLET_REF } from "@/types/ai";

export default async function Route(sock: WASocket, msg: IncomingMessage) {
  const text = msg.text?.trim();
  if (!text || !msg.jid) return;

  // Jika pesan berada di grup dan bukan command, abaikan agar tidak spam
  if (msg.type === "Group" && !text.startsWith("/")) return;

  // 1. Prioritaskan Slash Command (Tanpa memanggil AI -> Hemat Token)
  if (text.startsWith("/")) {
    const parsed = parseCommand(text);
    if (!parsed) return;

    switch (parsed.command) {
      case "help":
        await sendHelp(sock, msg.jid);
        return;

      case "login":
      case "register": // Fallback alias ke LoginCommand
        await LoginCommand(sock, msg, parsed);
        return;

      case "saldo": {
        if (!msg.fromNumber) {
          await sendFailedMessage(sock, msg.jid);
          return;
        }
        const user = await getUser(msg.fromNumber);
        if (!user) {
          await ResponseMessage(sock, msg.jid, [
            `⚠️ Nomor WhatsApp Anda (*${msg.fromNumber}*) belum terdaftar.`,
            "",
            "Silakan ketik */login* terlebih dahulu untuk mengaktifkan akun & dompet Anda.",
          ]);
          return;
        }
        const wallets = await getWallet(user.id);
        const walletItems = wallets.map((w) => ({
          name: w.name,
          balance: Number(w.currentBalance),
        }));
        const totalBalance = walletItems.reduce((acc, w) => acc + w.balance, 0);
        await sendBalanceSummary(sock, msg.jid, {
          userName: user.name,
          wallets: walletItems,
          totalBalance,
        });
        return;
      }

      default:
        await ResponseMessage(
          sock,
          msg.jid,
          `❓ Perintah */${parsed.command}* tidak dikenali.\n\nKetik */help* untuk melihat daftar perintah yang tersedia.`,
        );
        return;
    }
  }

  // 2. Validasi Nomor Pengirim & Status Registrasi User sebelum panggil AI
  if (!msg.fromNumber) {
    await sendFailedMessage(sock, msg.jid);
    return;
  }

  const user = await getUser(msg.fromNumber);
  if (!user) {
    await ResponseMessage(sock, msg.jid, [
      `👋 Halo *${msg.fromName || "Pengguna"}*! Nomor Anda (*${msg.fromNumber}*) belum terdaftar di BROBOT.`,
      "",
      "Ketik */login* untuk mendaftarkan akun secara otomatis, atau ketik */login --help* untuk info lebih lanjut.",
    ]);
    return;
  }

  // 3. Ekstraksi Pesan Natural via AI NLP
  const resAi = await ParseAi(text);
  console.log("resAi", resAi);

  switch (resAi.intent) {
    case "TRANSACTION": {
      if (!resAi.transaction) return;

      const typeCode =
        getRefCode(TYPE_REF, resAi.transaction.type) ?? TYPE_REF.EXPENSE.code;
      const categoryCode =
        getRefCode(CATEGORY_REF, resAi.transaction.category) ??
        CATEGORY_REF.Lainnya.code;
      const sourceWallCode =
        getRefCode(WALLET_REF, resAi.transaction.sourceWallet) ??
        WALLET_REF.Tunai.code;
      const destWallCode = getRefCode(
        WALLET_REF,
        resAi.transaction.destinationWallet,
      );

      await addTransactionBot(
        sourceWallCode,
        user.id,
        typeCode,
        categoryCode,
        resAi.transaction.amount,
        resAi.transaction.date,
        resAi.transaction.description,
        destWallCode ?? undefined,
      );

      await sendTransaction(sock, msg.jid, {
        type: resAi.transaction.type,
        amount: resAi.transaction.amount,
        category: resAi.transaction.category,
        walletName: resAi.transaction.sourceWallet ?? "Tunai",
        destinationWalletName: resAi.transaction.destinationWallet ?? undefined,
        description: resAi.transaction.description,
        date: resAi.transaction.date,
      });
      break;
    }

    case "QUERY_BALANCE": {
      const wallets = await getWallet(user.id);
      const walletItems = wallets.map((w) => ({
        name: w.name,
        balance: Number(w.currentBalance),
      }));
      const totalBalance = walletItems.reduce((acc, w) => acc + w.balance, 0);

      await sendBalanceSummary(sock, msg.jid, {
        userName: user.name,
        wallets: walletItems,
        totalBalance,
      });
      break;
    }

    case "CHITCHAT":
      await sendGreeting(sock, msg.jid, user.name);
      break;

    case "UNKNOWN":
    default:
      await sendHelp(sock, msg.jid);
      break;
  }
}
