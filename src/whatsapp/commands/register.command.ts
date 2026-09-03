import { IncomingMessage, ParsedCommand } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { addUser, getUser } from "@/controllers/auth.controller";
import { getErrorMessage } from "@/helpers/site";
import { prisma } from "@/lib/prisma";

const COMMON_CURRENCIES = new Set([
  "IDR", "USD", "EUR", "SGD", "MYR", "JPY", "CNY", "GBP", "AUD", "CAD",
  "CHF", "THB", "SAR", "KRW", "PHP", "VND", "INR", "NZD", "HKD"
]);

export default async function RegisterCommand(
  sock: WASocket,
  msg: IncomingMessage,
  parsed: ParsedCommand,
) {
  // 1. Cek jika pengguna meminta bantuan (--help, -h, atau tanpa argumen)
  if (
    parsed.args.length === 0 ||
    parsed.args.includes("--help") ||
    parsed.args.includes("-h")
  ) {
    await sock.sendMessage(msg.jid!, {
      text: [
        "📖 *Panduan Perintah: /register*",
        "",
        "Mendaftarkan akun baru ke dalam sistem keuangan.",
        "",
        "*Format:*",
        "`/register [name] [nik] [currency]`",
        "Atau gunakan tanda kutip untuk nama:",
        "`/register \"Nama Lengkap\" [nik] [currency]`",
        "",
        "*Parameter:*",
        "• *name* : Nama lengkap Anda (bisa 1 kata atau lebih)",
        "• *nik* : Nomor identitas (angka, opsional)",
        "• *currency* : Mata uang, contoh: IDR, USD, SGD (opsional, default: IDR)",
        "",
        "*Contoh Penggunaan:*",
        "• `/register Bot Brobot 3201010101010001 IDR`",
      ].join("\n"),
    });
    return;
  }

  const phone = msg.fromNumber;

  if (!phone) {
    await sock.sendMessage(msg.jid!, {
      text: "❌ *Gagal mendeteksi nomor WhatsApp.* Pastikan Anda mengirim pesan melalui chat pribadi.",
    });
    return;
  }

  // 2. Smart parsing argumen
  const rawArgs = [...parsed.args];
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
  // Mengambil token numerik terakhir (jika ada lebih dari 1 angka)
  const nikIndex = rawArgs.reduce(
    (lastIdx, arg, idx) => (/^\d+$/.test(arg) ? idx : lastIdx),
    -1,
  );
  if (nikIndex !== -1) {
    nik = rawArgs.splice(nikIndex, 1)[0];
  }

  // C. Sisa token adalah nama lengkap (baik 1 kata maupun banyak kata)
  const name = rawArgs.join(" ").trim();

  if (!name) {
    await sock.sendMessage(msg.jid!, {
      text: [
        "❌ *Nama wajib diisi!*",
        "",
        "Contoh format yang benar:",
        "• `/register Budi Santoso`",
        "• `/register perong 133 usd`",
        "• `/register \"Ahmad Fauzi\" 3201010101010001`",
      ].join("\n"),
    });
    return;
  }

  try {
    // Periksa apakah nomor sudah terdaftar
    const existingUser = await getUser(phone);
    if (existingUser) {
      await sock.sendMessage(msg.jid!, {
        text: [
          `⚠️ Nomor WhatsApp ini (*${phone}*) sudah terdaftar atas nama *${existingUser.name}*.`,
          "",
          "Ketik */login --this* untuk melihat status akun Anda.",
        ].join("\n"),
      });
      return;
    }

    // Periksa apakah NIK sudah digunakan jika diisi
    if (nik) {
      const existingNik = await prisma.user.findUnique({
        where: { nik },
      });
      if (existingNik) {
        await sock.sendMessage(msg.jid!, {
          text: `⚠️ NIK *${nik}* sudah digunakan oleh akun lain (*${existingNik.name}*). Silakan gunakan NIK yang valid.`,
        });
        return;
      }
    }

    const newUser = await addUser(phone, name, nik, currency);

    await sock.sendMessage(msg.jid!, {
      text: [
        "✅ *Registrasi Berhasil!*",
        "",
        `Selamat datang di Bot Catatan Keuangan, *${newUser.name}*!`,
        "",
        "👤 *Profil Akun:*",
        `• Nama: ${newUser.name}`,
        `• No. HP: ${newUser.phone}`,
        `• NIK: ${newUser.nik || "-"}`,
        `• Mata Uang: ${newUser.currency}`,
        "",
        "Akun Anda sudah aktif. Ketik */help* untuk melihat daftar perintah.",
      ].join("\n"),
    });
  } catch (error: unknown) {
    console.error("Error pada RegisterCommand:", error);
    await sock.sendMessage(msg.jid!, {
      text: `❌ Terjadi kesalahan saat registrasi: ${getErrorMessage(error)}`,
    });
  }
}

