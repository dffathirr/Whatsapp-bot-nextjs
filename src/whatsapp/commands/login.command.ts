import { IncomingMessage, ParsedCommand } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { addUser, getUser } from "@/controllers/auth.controller";
import { COMMON_CURRENCIES, generateToken, getErrorMessage } from "@/helpers/site";
import { prisma } from "@/lib/prisma";
import { ResponseMessage } from "../response";

export default async function LoginCommand(
  sock: WASocket,
  msg: IncomingMessage,
  parsed: ParsedCommand,
) {
  // 1. Cek jika pengguna meminta bantuan (--help atau -h)
  if (parsed.args.includes("--help") || parsed.args.includes("-h")) {
    await ResponseMessage(sock, msg.jid!, [
      "📖 *Panduan Perintah: /login*",
      "",
      "Mendaftarkan akun baru atau memeriksa informasi akun Anda berdasarkan nomor WhatsApp.",
      "",
      "*Format:*",
      "• `/login` — Masuk / Daftar otomatis (menggunakan nama profil WA)",
      "• `/login [nama] [nik?] [currency?]` — Daftar akun dengan detail profil",
      "• `/login --add [nama] [nik?] [currency?]` — Daftar akun baru secara eksplisit",
      "• `/login --info` — Lihat informasi profil & status sesi akun Anda",
      "",
      "*Contoh Penggunaan:*",
      "• `/login`",
      "• `/login Budi Santoso`",
      "• `/login --add Budi Santoso 3201010101010001 IDR`",
      "• `/login --info`",
    ]);
    return;
  }

  const phone = msg.fromNumber;

  if (!phone) {
    await ResponseMessage(
      sock,
      msg.jid!,
      "❌ *Gagal mendeteksi nomor WhatsApp.* Pastikan Anda mengirim pesan melalui chat pribadi.",
    );
    return;
  }

  try {
    const existingUser = await getUser(phone);
    const isInfoFlag = parsed.args.includes("--info") || parsed.args.includes("--this");
    const isAddFlag = parsed.args.includes("--add");

    // 2. Jika menggunakan flag --info / --this, atau user sudah terdaftar
    if (isInfoFlag || (existingUser && !isAddFlag)) {
      if (!existingUser) {
        await ResponseMessage(sock, msg.jid!, [
          `❌ Nomor WhatsApp Anda (*${phone}*) belum terdaftar!`,
          "",
          "Silakan daftar cukup dengan mengetik:",
          "• `/login` (otomatis memakai nama profil WA)",
          "• `/login [nama] [nik?] [currency?]`",
          "• `/login --add Budi Santoso`",
        ]);
        return;
      }

      const { expired_date } = generateToken({
        userId: existingUser.id,
        nama: existingUser.name,
        phone: existingUser.phone ?? phone,
        nik: existingUser.nik || undefined,
      });

      const expiredFormatted = expired_date
        ? new Date(expired_date).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          })
        : "-";

      await ResponseMessage(sock, msg.jid!, [
        "✅ *Informasi Akun BROBOT*",
        "────────────────────",
        `• Nama       : *${existingUser.name}*`,
        `• No. HP     : ${existingUser.phone}`,
        `• NIK        : ${existingUser.nik || "-"}`,
        `• Mata Uang  : ${existingUser.currency}`,
        `• Status     : Aktif & Terverifikasi`,
        `• Sesi Aktif : s/d ${expiredFormatted}`,
        "────────────────────",
        "Ketik transaksi Anda secara langsung (contoh: _\"beli kopi 25rb\"_) atau ketik */help* untuk panduan.",
      ]);
      return;
    }

    // Jika user mengetik /login --add tetapi nomornya sudah terdaftar
    if (existingUser && isAddFlag) {
      await ResponseMessage(sock, msg.jid!, [
        `⚠️ Nomor WhatsApp ini (*${phone}*) sudah terdaftar atas nama *${existingUser.name}*.`,
        "",
        "Ketik */login --info* untuk melihat profil akun Anda.",
      ]);
      return;
    }

    // 3. Proses Pendaftaran Akun Baru (/login atau /login --add [nama] [nik] [currency])
    const rawArgs = parsed.args.filter((arg) => arg !== "--add");
    let currency = "IDR";
    let nik: string | undefined = undefined;

    // A. Ekstrak currency jika ada token yang cocok dengan daftar mata uang resmi
    const currencyIndex = rawArgs.findIndex((arg) =>
      COMMON_CURRENCIES.has(arg.toUpperCase()),
    );
    if (currencyIndex !== -1) {
      currency = rawArgs.splice(currencyIndex, 1)[0].toUpperCase();
    }

    // B. Ekstrak NIK jika ada token yang murni angka (/^\d+$/)
    const nikIndex = rawArgs.reduce(
      (lastIdx, arg, idx) => (/^\d+$/.test(arg) ? idx : lastIdx),
      -1,
    );
    if (nikIndex !== -1) {
      nik = rawArgs.splice(nikIndex, 1)[0];
    }

    // C. Sisa token adalah nama lengkap; jika kosong gunakan nama profil WhatsApp (msg.fromName)
    const name = rawArgs.join(" ").trim() || msg.fromName?.trim();

    if (!name) {
      await ResponseMessage(sock, msg.jid!, [
        "❌ *Nama belum terdeteksi!*",
        "",
        "Silakan sertakan nama Anda:",
        "• `/login Budi Santoso`",
        "• `/login --add Budi Santoso 3201010101010001 IDR`",
      ]);
      return;
    }

    // Periksa apakah NIK sudah digunakan jika diisi
    if (nik) {
      const existingNik = await prisma.user.findUnique({
        where: { nik },
      });
      if (existingNik) {
        await ResponseMessage(
          sock,
          msg.jid!,
          `⚠️ NIK *${nik}* sudah digunakan oleh akun lain (*${existingNik.name}*). Silakan gunakan NIK yang berbeda.`,
        );
        return;
      }
    }

    const newUser = await addUser(phone, name, nik, currency);

    await ResponseMessage(sock, msg.jid!, [
      "✅ *Akun Berhasil Didaftarkan!*",
      "────────────────────",
      `Selamat datang di BROBOT, *${newUser.name}*!`,
      "",
      "👤 *Profil Akun:*",
      `• Nama           : ${newUser.name}`,
      `• No. HP         : ${newUser.phone}`,
      `• NIK            : ${newUser.nik || "-"}`,
      `• Mata Uang      : ${newUser.currency}`,
      `• Dompet Default : Tunai (Rp 0)`,
      "────────────────────",
      "Sekarang Anda bisa langsung mencatat keuangan lewat chat biasa (contoh: _\"gajian 5jt\"_ atau _\"beli makan 25rb\"_).",
    ]);
  } catch (error: unknown) {
    console.error("Error pada LoginCommand:", error);
    await ResponseMessage(
      sock,
      msg.jid!,
      `❌ Terjadi kesalahan saat memproses akun: ${getErrorMessage(error)}`,
    );
  }
}
