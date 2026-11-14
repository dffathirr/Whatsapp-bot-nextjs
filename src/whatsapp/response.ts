import { formatDate, formatRupiah } from "@/helpers/site";
import { BalanceSummaryPayload, TransactionPayload } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";

export {
  ResponseMessage,
  sendGreeting,
  sendHelp,
  sendCommandHelp,
  sendFailedMessage,
  sendTransaction,
  sendBalanceSummary,
  sendMissingWalletError,
  sendInsufficientBalanceError,
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
    `👋 *Halo${name ? `, ${name}` : ""}! Selamat datang di .bot BROBOT*`,
    "Saya adalah asisten otomatis untuk mencatat transaksi dan memantau keuangan Anda langsung dari WhatsApp.",
    "",
    "Ketik */help* untuk melihat daftar perintah yang tersedia.",
  ]);
};

const sendHelp = async (sock: WASocket, jid: string) => {
  return ResponseMessage(sock, jid, [
    "📌 *Daftar Perintah .bot BROBOT:*",
    "",
    "• */login* — Daftar akun baru / cek info akun",
    "• */wallet* — Cek saldo & kelola dompet",
    "• */add* — Catat pemasukan",
    "• */buy* — Catat pengeluaran",
    // "• */tf* — Transfer antar-dompet",
    // "• */adjust* — Penyesuaian saldo",
    "",
    "> 💡 *Tips:* Tambahkan argumen *--help* di belakang setiap perintah (contoh: */add --help* atau */login --help*) untuk melihat rincian format serta contoh penggunaannya.",
  ]);
};

const sendCommandHelp = async (
  sock: WASocket,
  jid: string,
  command: "wallet" | "add" | "buy", // | "tf" | "adjust"
) => {
  switch (command) {
    case "wallet":
      return ResponseMessage(sock, jid, [
        "📖 *Panduan Perintah: /wallet*",
        "",
        "Melihat daftar dompet, total saldo, atau mengelola dompet Anda (wajib menggunakan awalan `/wallet`).",
        "",
        "*Format & Contoh Penggunaan:*",
        "• `/wallet` — Menampilkan seluruh dompet & total saldo saat ini",
        "• `/wallet --add [dompet] [saldo_awal]` — Menambah dompet baru",
        "• `/wallet --set [dompet] [saldo_baru]` — Mengubah saldo dompet",
        "• `/wallet --list` — Melihat daftar bank & e-wallet yang didukung",
        "",
        "*Contoh:*",
        "• `/wallet --add bca 1jt`",
        "• `/wallet --add gopay 250rb`",
        "• `/wallet --set tunai 500rb`",
      ]);

    case "add":
      return ResponseMessage(sock, jid, [
        "📖 *Panduan Perintah: /add (Pemasukan)*",
        "",
        "Mencatat transaksi uang masuk (gaji, bonus, transferan masuk, dll).",
        "",
        "*Contoh Penggunaan:*",
        "• `/add gajian masuk 5jt di bca`",
        "• `/add dapet bonus freelance 750rb ke mandiri`",
        "• `/add dikasih uang tunai 100rb`",
        "",
        "> 💡 *Tips:* Anda juga bisa langsung mengetik _\"gajian masuk 5jt di bca\"_ di chat tanpa awalan `/add`.",
      ]);

    case "buy":
      return ResponseMessage(sock, jid, [
        "📖 *Panduan Perintah: /buy (Pengeluaran)*",
        "",
        "Mencatat transaksi pengeluaran (belanja, makan, tagihan, dll). Jika dompet tidak disebutkan, otomatis memotong dompet *Tunai*.",
        "",
        "*Contoh Penggunaan:*",
        "• `/buy beli ayam 1 ekor 35rb` (otomatis potong Tunai)",
        "• `/buy makan siang nasi padang 28k pake gopay`",
        "• `/buy bayar wifi indihome 350rb dari bca`",
        "",
        "> 💡 *Tips:* Anda juga bisa langsung mengetik _\"beli kopi 25rb pake gopay\"_ di chat tanpa awalan `/buy`.",
      ]);

    // case "tf":
    //   return ResponseMessage(sock, jid, [
    //     "📖 *Panduan Perintah: /tf (Transfer Antar-Dompet)*",
    //     "",
    //     "Memindahkan saldo dari satu dompet/bank ke dompet lainnya secara otomatis.",
    //     "",
    //     "*Contoh Penggunaan:*",
    //     "• `/tf 200rb dari bca ke shopeepay buat belanja`",
    //     "• `/tf pindah saldo 500k dari mandiri ke gopay`",
    //     "• `/tf tarik tunai 300rb dari bca ke tunai`",
    //     "",
    //     "> 💡 *AI-First:* Anda juga bisa langsung mengetik _\"tf 200rb dari bca ke dana\"_ di chat tanpa awalan `/tf`.",
    //   ]);

    // case "adjust":
    //   return ResponseMessage(sock, jid, [
    //     "📖 *Panduan Perintah: /adjust (Penyesuaian Saldo & Dompet)*",
    //     "",
    //     "Menyesuaikan/mengoreksi saldo dompet ke nominal sebenarnya atau mendaftarkan dompet baru beserta saldo awalnya.",
    //     "",
    //     "*Contoh Penggunaan:*",
    //     "• `/adjust saldo tunai sekarang 150rb`",
    //     "• `/adjust ubah saldo bca jadi 2.5jt`",
    //     "• `/adjust buat dompet gopay saldo awal 500rb`",
    //     "",
    //     "> 💡 *AI-First:* Anda juga bisa langsung mengetik _\"ubah saldo tunai jadi 150rb\"_ di chat tanpa awalan `/adjust`.",
    //   ]);
  }
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

/**
 * Format pesan balasan WhatsApp untuk ringkasan saldo pengguna (Gaya Minimalis)
 */
const sendBalanceSummary = async (
  sock: WASocket,
  jid: string,
  payload: BalanceSummaryPayload,
) => {
  const { userName, wallets, totalBalance, lastUpdated } = payload;
  const waktu = lastUpdated
    ? formatDate(lastUpdated, { format: "Y-M-D H:i:s" })
    : "-";
  const lines: string[] = [];

  lines.push("💰 *Informasi Saldo Dompet*");
  if (userName) {
    lines.push(`Akun: *${userName}*`);
  }
  lines.push(`Last Update: ${waktu}`);
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

const sendMissingWalletError = async (
  sock: WASocket,
  jid: string,
  walletName: string,
) => {
  const shortAlias = walletName.replace(/^Bank\s+/i, "").toLowerCase();
  return ResponseMessage(sock, jid, [
    `⚠️ *Dompet ${walletName} Belum Terdaftar*`,
    "────────────────────",
    `Anda belum menambahkan dompet *${walletName}* di akun Anda.`,
    "",
    "Silakan daftarkan dompet terlebih dahulu dengan mengetik:",
    `• \`/wallet --add ${shortAlias} [saldo_awal]\``,
    "",
    `*Contoh:* \`/wallet --add ${shortAlias} 500rb\``,
  ]);
};

const sendInsufficientBalanceError = async (
  sock: WASocket,
  jid: string,
  walletName: string,
  currentBalance: number,
  requiredAmount: number,
) => {
  const kurang = requiredAmount - currentBalance;
  return ResponseMessage(sock, jid, [
    `❌ *Saldo ${walletName} Tidak Mencukupi*`,
    "────────────────────",
    `• Nominal Transaksi : *${formatRupiah(requiredAmount)}*`,
    `• Saldo ${walletName} : *${formatRupiah(currentBalance)}*`,
    `• Kekurangan        : ${formatRupiah(kurang)}`,
    "────────────────────",
    "Silakan tambah pemasukan (`/add`) atau sesuaikan saldo dompet melalui `/wallet --set` terlebih dahulu.",
  ]);
};
