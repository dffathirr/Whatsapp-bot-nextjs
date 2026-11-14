import { IncomingMessage } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { parseCommand } from "./parser";
import LoginCommand from "./commands/login.command";
import WalletCommand from "./commands/wallet.command";
import {
  ResponseMessage,
  sendCommandHelp,
  sendFailedMessage,
  sendGreeting,
  sendHelp,
  sendInsufficientBalanceError,
  sendMissingWalletError,
  sendTransaction,
} from "./response";
import { ParseAi } from "@/configs/ai";
import { addTransactionBot } from "@/controllers/transaction.controller";
import { getUser } from "@/controllers/auth.controller";
import { CATEGORY_REF, getRefCode, TYPE_REF, WALLET_REF } from "@/types/ai";

const NLP_COMMAND_HINTS: Record<string, string> = {
  add: "[Pemasukan / Income]",
  buy: "[Pengeluaran / Expense]",
  // tf: "[Transfer Antar-Dompet]",
  // adjust: "[Penyesuaian Saldo Dompet]",
};

export default async function Route(sock: WASocket, msg: IncomingMessage) {
  const text = msg.text?.trim();
  if (!text || !msg.jid) return;

  // Jika pesan berada di grup dan bukan command, abaikan agar tidak spam
  if (msg.type === "Group" && !text.startsWith("/")) return;

  let aiInputText = text;
  let forcedTransactionType:
    | "INCOME"
    | "EXPENSE"
    | "TRANSFER"
    | "ADJUSTMENT"
    | null = null;

  // 1. Cek jika pesan diawali '/' (Slash Command)
  if (text.startsWith("/")) {
    const parsed = parseCommand(text);
    if (!parsed) return;

    const isHelpFlag =
      parsed.args.includes("--help") || parsed.args.includes("-h");

    switch (parsed.command) {
      case "help":
        await sendHelp(sock, msg.jid);
        return;

      // /login wajib menggunakan slash (tidak diproses lewat free text NLP)
      case "login":
      case "register":
        await LoginCommand(sock, msg, parsed);
        return;

      // /wallet wajib menggunakan slash untuk cek saldo, tambah dompet, atau set saldo
      case "wallet":
      case "saldo":
        await WalletCommand(sock, msg, parsed);
        return;

      // /add, /buy mendukung --help dan kalimat NLP setelahnya
      // (command /tf dan /adjust di-nonaktifkan sementara hingga Sprint 4)
      case "add":
      case "buy": {
        // case "tf":
        // case "adjust": {
        const cmd = parsed.command as "add" | "buy";
        if (parsed.args.length === 0 || isHelpFlag) {
          await sendCommandHelp(sock, msg.jid, cmd);
          return;
        }

        if (cmd === "add") forcedTransactionType = "INCOME";
        else if (cmd === "buy") forcedTransactionType = "EXPENSE";
        // else if (cmd === "tf") forcedTransactionType = "TRANSFER";
        // else if (cmd === "adjust") forcedTransactionType = "ADJUSTMENT";

        const argText = text.replace(/^\/\S+\s*/, "").trim();
        aiInputText = `${NLP_COMMAND_HINTS[cmd]} ${argText}`;
        break;
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

  // 2. Validasi Nomor Pengirim & Status Registrasi User sebelum memanggil AI NLP
  if (!msg.fromNumber) {
    await sendFailedMessage(sock, msg.jid);
    return;
  }

  const user = await getUser(msg.fromNumber);
  if (!user) {
    await ResponseMessage(sock, msg.jid, [
      `👋 Halo *${msg.fromName || "Pengguna"}*! Nomor Anda (*${msg.fromNumber}*) belum terdaftar di .bot BROBOT.`,
      "",
      "Ketik */login* untuk mendaftarkan akun secara otomatis, atau */help* untuk melihat panduan perintah.",
    ]);
    return;
  }

  // 3. Ekstraksi Pesan Natural via AI NLP (Free Text untuk add/buy atau via /add, /buy, /tf, /adjust)
  const resAi = await ParseAi(aiInputText);
  console.log("resAi", resAi);

  switch (resAi.intent) {
    case "TRANSACTION": {
      if (!resAi.transaction) return;

      const finalType = forcedTransactionType ?? resAi.transaction.type;
      const typeCode = getRefCode(TYPE_REF, finalType) ?? TYPE_REF.EXPENSE.code;
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

      const result = await addTransactionBot(
        sourceWallCode,
        user.id,
        typeCode,
        categoryCode,
        resAi.transaction.amount,
        resAi.transaction.date,
        resAi.transaction.description,
        destWallCode ?? undefined,
      );

      if (result.status === "MISSING_WALLET") {
        await sendMissingWalletError(sock, msg.jid, result.missingWalletName);
        return;
      }

      if (result.status === "INSUFFICIENT_BALANCE") {
        await sendInsufficientBalanceError(
          sock,
          msg.jid,
          result.walletName,
          result.currentBalance,
          result.requiredAmount,
        );
        return;
      }

      await sendTransaction(sock, msg.jid, {
        type: finalType,
        amount: resAi.transaction.amount,
        category: resAi.transaction.category,
        walletName: result.walletName,
        currentBalance: result.currentBalance,
        destinationWalletName: result.destinationWalletName,
        destinationBalance: result.destinationBalance,
        description: resAi.transaction.description,
        date: resAi.transaction.date,
      });
      break;
    }

    case "QUERY_BALANCE": {
      // Karena /wallet wajib menggunakan slash, arahkan user untuk mengetik /wallet
      await ResponseMessage(sock, msg.jid, [
        "💡 Untuk melihat daftar dompet dan mengecek saldo, silakan gunakan perintah:",
        "• */wallet* — Cek seluruh saldo dompet",
        "• */wallet --help* — Panduan tambah/kelola dompet",
      ]);
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
