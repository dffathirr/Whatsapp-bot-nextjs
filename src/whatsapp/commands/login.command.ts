import { IncomingMessage, ParsedCommand } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { getUser } from "@/controllers/auth.controller";
import { generateToken, getErrorMessage } from "@/helpers/site";
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
      "Memeriksa status akun dan menghasilkan token sesi login.",
      "",
      "*Format:*",
      "• `/login --this` — Login menggunakan nomor WhatsApp Anda saat ini.",
      "• `/login <nomor_hp>` — Login menggunakan nomor HP tertentu.",
      "• `/login` — Default (otomatis menggunakan nomor Anda).",
      "",
      "*Contoh Penggunaan:*",
      "• `/login --this`",
      "• `/login`",
      "• `/login 08123456789`",
      "• `/login 628123456789`",
    ]);
    return;
  }

  let targetPhone: string | undefined;

  const arg = parsed.args[0]?.trim();

  // Jika menggunakan flag --this atau tanpa argumen, gunakan nomor WhatsApp pengirim
  if (!arg || arg === "--this") {
    targetPhone = msg.fromNumber;
  } else {
    // Normalisasi input nomor HP (hapus spasi, tanda minus, plus)
    targetPhone = arg.replace(/[\s-+]/g, "");

    // Normalisasi format lokal 08xxx menjadi 628xxx
    if (targetPhone.startsWith("08")) {
      targetPhone = "62" + targetPhone.slice(1);
    }
  }

  if (!targetPhone) {
    await ResponseMessage(sock, msg.jid!, [
      "⚠️ *Format Login Salah*",
      "",
      "Gunakan format:",
      "• `/login --this` (login menggunakan nomor WhatsApp saat ini)",
      "• `/login <nomor_hp>` (contoh: `/login 08123456789`)",
    ]);
    return;
  }

  try {
    const user = await getUser(targetPhone);

    if (!user) {
      await ResponseMessage(sock, msg.jid!, [
        `❌ Nomor *${targetPhone}* belum terdaftar!`,
        "",
        "Silakan daftar terlebih dahulu dengan mengetik:",
        "`/register [name] [nik] [currency]`",
        "Contoh: `/register Budi Santoso`",
      ]);
      return;
    }

    // Integrasi dengan helper generateToken dari sistem auth API
    const { token, expired_date } = generateToken({
      userId: user.id,
      nama: user.name,
      phone: user.phone ?? targetPhone,
      nik: user.nik || undefined,
    });

    const expiredFormatted = expired_date
      ? new Date(expired_date).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
        })
      : "-";

    await ResponseMessage(sock, msg.jid!, [
      "✅ *Login Berhasil!*",
      "",
      `Selamat datang kembali, *${user.name}*!`,
      "",
      "👤 *Profil Pengguna:*",
      `• Nama: ${user.name}`,
      `• No. HP: ${user.phone}`,
      `• NIK: ${user.nik || "-"}`,
      `• Mata Uang: ${user.currency}`,
      "",
      "🔐 *Status Sesi:* Aktif & Terverifikasi",
      `⏳ *Kedaluwarsa Token:* ${expiredFormatted}`,
      "",
      "Ketik */help* untuk melihat menu transaksi.",
    ]);
  } catch (error: unknown) {
    console.error("Error pada LoginCommand:", error);
    await ResponseMessage(
      sock,
      msg.jid!,
      `❌ Terjadi kesalahan saat login: ${getErrorMessage(error)}`,
    );
  }
}
