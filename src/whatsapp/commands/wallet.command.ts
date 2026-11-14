import { IncomingMessage, ParsedCommand } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { getUser } from "@/controllers/auth.controller";
import {
  addWallet,
  checkWallet,
  checkWalletByName,
  getWallet,
  updateWallet,
} from "@/controllers/wallet.controller";
import {
  formatRupiah,
  getErrorMessage,
  parseNominalInput,
} from "@/helpers/site";
import { resolveWalletByInput, WALLET_REF } from "@/types/ai";
import {
  ResponseMessage,
  sendBalanceSummary,
  sendCommandHelp,
  sendFailedMessage,
} from "../response";

export default async function WalletCommand(
  sock: WASocket,
  msg: IncomingMessage,
  parsed: ParsedCommand,
) {
  const jid = msg.jid!;

  // 1. Jika meminta bantuan (--help atau -h)
  if (parsed.args.includes("--help") || parsed.args.includes("-h")) {
    await sendCommandHelp(sock, jid, "wallet");
    return;
  }

  if (!msg.fromNumber) {
    await sendFailedMessage(sock, jid);
    return;
  }

  try {
    const user = await getUser(msg.fromNumber);
    if (!user) {
      await ResponseMessage(sock, jid, [
        `⚠️ Nomor WhatsApp Anda (*${msg.fromNumber}*) belum terdaftar di .bot BROBOT.`,
        "",
        "Ketik */login* untuk mengaktifkan akun & dompet Anda secara otomatis, atau */help* untuk melihat panduan.",
      ]);
      return;
    }

    const isInfoFlag = parsed.args.includes("--info");
    const isListFlag = parsed.args.includes("--list");
    const isAddFlag = parsed.args.includes("--add");
    const isSetFlag =
      parsed.args.includes("--set") || parsed.args.includes("--update");

    // 2. Jika "/wallet --list": tampilkan daftar nama dompet referensi yang didukung
    if (isListFlag) {
      const refLines = Object.keys(WALLET_REF).map((name) => `• *${name}*`);
      await ResponseMessage(sock, jid, [
        "🏦 *Daftar Dompet yang Didukung .bot BROBOT:*",
        "────────────────────",
        ...refLines,
        "────────────────────",
        "Contoh tambah dompet:",
        "• `/wallet --add bca 500rb`",
        "• `/wallet --add gopay 150000`",
      ]);
      return;
    }

    // 3. Jika hanya "/wallet" atau "/wallet --info": tampilkan ringkasan saldo seluruh dompet
    if (parsed.args.length === 0 || isInfoFlag) {
      const wallets = await getWallet(user.id);
      const walletItems = wallets.map((w) => ({
        name: w.name,
        balance: Number(w.currentBalance),
      }));
      const totalBalance = walletItems.reduce((acc, w) => acc + w.balance, 0);
      const lastUpdated = wallets.reduce<Date | undefined>(
        (max, w) => (!max || w.updatedAt > max ? w.updatedAt : max),
        undefined,
      );

      await sendBalanceSummary(sock, jid, {
        userName: user.name,
        wallets: walletItems,
        totalBalance,
        lastUpdated,
      });
      return;
    }

    // 4. Proses Tambah / Update Dompet:
    // Mendukung:
    // - /wallet --add bca 500rb
    // - /wallet --add "Bank BCA" 500000
    // - /wallet --set bca 1.5jt
    // - /wallet bca 500rb (shorthand tambah/cek)
    const cleanArgs = parsed.args.filter(
      (a) => !["--add", "--set", "--update", "--info", "--list"].includes(a),
    );

    if (cleanArgs.length === 0) {
      await sendCommandHelp(sock, jid, "wallet");
      return;
    }

    // Cek apakah argumen terakhir adalah nominal angka (misal 500rb, 1jt, 0, 250000)
    let balanceInput: number | null = null;
    let walletTokens = [...cleanArgs];

    if (cleanArgs.length >= 2) {
      const maybeNominal = parseNominalInput(cleanArgs[cleanArgs.length - 1]);
      if (maybeNominal !== null) {
        balanceInput = maybeNominal;
        walletTokens = cleanArgs.slice(0, -1);
      }
    }

    const walletQuery = walletTokens.join(" ").trim();
    const resolved = resolveWalletByInput(walletQuery);

    if (!resolved) {
      await ResponseMessage(sock, jid, [
        `❌ Dompet *"${walletQuery}"* tidak dikenali dalam daftar referensi.`,
        "",
        "Ketik */wallet --list* untuk melihat daftar nama bank/e-wallet yang tersedia.",
      ]);
      return;
    }

    const existingWallet =
      (await checkWallet(user.id, resolved.code)) ??
      (await checkWalletByName(user.id, resolved.name));

    // Jika user menggunakan flag --set / --update, atau jika dompet sudah ada dan user ingin mengubah saldonya via --set
    if (isSetFlag) {
      if (!existingWallet) {
        await ResponseMessage(sock, jid, [
          `⚠️ Dompet *${resolved.name}* belum terdaftar di akun Anda.`,
          "",
          `Ketik \`/wallet --add ${walletQuery} ${balanceInput ?? 0}\` untuk mendaftarkannya.`,
        ]);
        return;
      }

      if (balanceInput === null) {
        await ResponseMessage(sock, jid, [
          "⚠️ Nominal saldo baru wajib diisi!",
          `Contoh: \`/wallet --set ${walletQuery} 500rb\``,
        ]);
        return;
      }

      const previousBalance = Number(existingWallet.currentBalance);
      const updated = await updateWallet(
        user.id,
        existingWallet.kdWallet,
        balanceInput,
      );

      await ResponseMessage(sock, jid, [
        "✅ *Saldo Dompet Diperbarui*",
        "────────────────────",
        `• Dompet        : *${updated.name}*`,
        `• Saldo Sebelum : ${formatRupiah(previousBalance)}`,
        `• Saldo Terkini : *${formatRupiah(Number(updated.currentBalance))}*`,
      ]);
      return;
    }

    // Jika menambah dompet baru (--add atau shorthand `/wallet bca 500rb`)
    if (existingWallet) {
      await ResponseMessage(sock, jid, [
        `ℹ️ Dompet *${existingWallet.name}* sudah terdaftar di akun Anda.`,
        `💳 Saldo terkini ${existingWallet.name}: *${formatRupiah(Number(existingWallet.currentBalance))}*`,
        "",
        `> 💡*Tips:* Ingin memperbarui saldo dompet ini? Ketik: \`/wallet --set ${walletQuery} [saldo_baru]\``,
      ]);
      return;
    }

    const initialBalance = balanceInput ?? 0;
    const created = await addWallet(
      user.id,
      resolved.code,
      resolved.name,
      initialBalance,
      initialBalance,
    );

    await ResponseMessage(sock, jid, [
      "✅ *Dompet Baru Berhasil Ditambahkan!*",
      "────────────────────",
      `• Nama Dompet : *${created.name}*`,
      `• Saldo Awal  : *${formatRupiah(Number(created.currentBalance))}*`,
      "────────────────────",
      `💳 Saldo terkini ${created.name}: *${formatRupiah(Number(created.currentBalance))}*`,
    ]);
  } catch (error: unknown) {
    console.error("Error pada WalletCommand:", error);
    await ResponseMessage(
      sock,
      jid,
      `❌ Terjadi kesalahan saat mengelola dompet: ${getErrorMessage(error)}`,
    );
  }
}
