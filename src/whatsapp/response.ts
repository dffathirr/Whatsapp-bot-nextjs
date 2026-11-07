import { formatDate, formatRupiah } from "@/helpers/site";
import { TransactionPayload } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";

export {
  ResponseMessage,
  sendGreeting,
  sendHelp,
  sendFailedMessage,
  sendTransaction,
  sendBalanceSummary,
};

async function ResponseMessage(
  sock: WASocket,
  jid: string,
  message: string | string[],
) {
  if (!jid) return;
  const text = Array.isArray(message) ? message.join("\n") : message;
  return await sock.sendMessage(jid, { text });
}

const sendFailedMessage = async (sock: WASocket, jid: string) => {
  return ResponseMessage(
    sock,
    jid,
    "❌ *Gagal mendeteksi nomor WhatsApp.* Pastikan Anda mengirim pesan melalui chat pribadi.",
  );
};

const sendGreeting = async (sock: WASocket, jid: string, name?: string) => {
  return ResponseMessage(sock, jid, [
    `👋 *Halo${name ? `, ${name}` : ""}! Selamat datang di BROBOT*`,
    "Saya adalah asisten otomatis untuk mencatat transaksi dan memantau keuangan Anda langsung dari WhatsApp.",
    "",
    "Ketik */help* untuk melihat daftar perintah yang tersedia.",
  ]);
};

const sendHelp = async (sock: WASocket, jid: string) => {
  return ResponseMessage(sock, jid, [
    "📌 *Panduan Penggunaan BROBOT*",
    "────────────────────",
    "*1. Perintah Akun & Utilitas:*",
    "• `/login` — Daftar akun otomatis (atau cek status akun)",
    "• `/login --add [nama] [nik?] [currency?]` — Daftar dengan nama kustom",
    "• `/login --info` — Lihat profil & masa aktif sesi",
    "• `/saldo` — Lihat daftar dompet & total saldo",
    "• `/help` — Tampilkan panduan ini",
    "",
    "*2. Chat Transaksi Otomatis (AI):*",
    "Cukup ketik pesan sehari-hari tanpa garis miring (`/`):",
    "• _\"beli ayam 35rb\"_ (otomatis potong Tunai)",
    "• _\"ngopi 25k pake gopay\"_",
    "• _\"gajian masuk 5jt di bca\"_",
    "• _\"tf 200rb dari bca ke shopeepay\"_",
    "• _\"sisa saldo saya berapa?\"_",
    "",
    "> 💡 *Tips:* Ketik `/login --help` untuk rincian parameter registrasi akun.",
  ]);
};

const sendTransaction = async (
  sock: WASocket,
  jid: string,
  payload: TransactionPayload,
) => {
  const {
    type,
    amount,
    category,
    walletName,
    currentBalance,
    destinationWalletName,
    destinationBalance,
    description,
    date,
    merchantName,
  } = payload;

  const waktu = formatDate(date ?? "", { format: "Y-M-D H:i:s" });
  const nominalStr = formatRupiah(amount);
  const lines: string[] = [];

  const title =
    type === "EXPENSE"
      ? "✅ *Transaksi Berhasil Dicatat*"
      : type === "INCOME"
        ? "✅ *Pemasukan Berhasil Dicatat*"
        : type === "TRANSFER"
          ? "🔄 *Transfer Saldo Berhasil*"
          : "⚖️ *Penyesuaian Saldo Dicatat*";

  lines.push(title);
  lines.push("────────────────────");

  if (type === "TRANSFER") {
    lines.push(`• Nominal  : *${nominalStr}*`);
    lines.push(`• Dari     : ${walletName}`);
    if (destinationWalletName)
      lines.push(`• Ke       : ${destinationWalletName}`);
    lines.push(`• Catatan  : ${description}`);
    lines.push(`• Waktu    : ${waktu}`);
    lines.push("────────────────────");
    if (currentBalance !== undefined || destinationBalance !== undefined) {
      if (currentBalance !== undefined) {
        lines.push(
          `💳 Saldo terkini ${walletName}: *${formatRupiah(currentBalance)}*`,
        );
      }
      if (destinationWalletName && destinationBalance !== undefined) {
        lines.push(
          `💳 Saldo terkini ${destinationWalletName}: *${formatRupiah(destinationBalance)}*`,
        );
      }
    }
  } else {
    lines.push(
      `• Jenis    : ${type === "EXPENSE" ? "Pengeluaran" : type === "INCOME" ? "Pemasukan" : "Penyesuaian"}`,
    );
    lines.push(`• Nominal  : *${nominalStr}*`);
    if (category) lines.push(`• Kategori : ${category}`);
    if (merchantName) lines.push(`• Toko     : ${merchantName}`);
    lines.push(`• Dompet   : ${walletName}`);
    lines.push(`• Catatan  : ${description}`);
    lines.push(`• Waktu    : ${waktu}`);
    lines.push("────────────────────");

    if (currentBalance !== undefined) {
      lines.push(
        `💳 Saldo terkini ${walletName}: *${formatRupiah(currentBalance)}*`,
      );
    }
  }

  return ResponseMessage(sock, jid, lines);
};

export interface WalletBalanceItem {
  name: string;
  balance: number;
}

export interface BalanceSummaryPayload {
  userName?: string;
  wallets: WalletBalanceItem[];
  totalBalance: number;
}

/**
 * Format pesan balasan WhatsApp untuk ringkasan saldo pengguna (Gaya Minimalis)
 */
const sendBalanceSummary = async (
  sock: WASocket,
  jid: string,
  payload: BalanceSummaryPayload,
) => {
  const { userName, wallets, totalBalance } = payload;
  const waktu = formatDate(new Date(), { format: "Y-M-D H:i:s" });
  const lines: string[] = [];

  lines.push("💰 *Informasi Saldo Dompet*");
  if (userName) {
    lines.push(`Akun: *${userName}* (${waktu})`);
  } else {
    lines.push(`Per ${waktu}`);
  }
  lines.push("────────────────────");

  if (wallets.length === 0) {
    lines.push("Belum ada dompet aktif terdaftar.");
  } else {
    for (const w of wallets) {
      lines.push(`• ${w.name.padEnd(12, " ")}: ${formatRupiah(w.balance)}`);
    }
  }

  lines.push("────────────────────");
  lines.push(`*Total Saldo  : ${formatRupiah(totalBalance)}*`);

  return ResponseMessage(sock, jid, lines);
};
