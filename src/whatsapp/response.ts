import { WASocket } from "@whiskeysockets/baileys";

export { ResponseMessage, sendGreeting, sendHelp, sendFailedMessage };

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
    "📌 *Daftar Perintah BROBOT:*",
    "",
    "• */register* — Mendaftar akun baru",
    "• */login* — Cek status dan login akun",
    "• */add* — Catat pemasukan",
    "• */buy* — Catat pengeluaran",
    "• */tf* — Transfer antar-dompet",
    "• */adjust* — Penyesuaian saldo",
    "",
    "> 💡 *Tips:* Tambahkan argumen *--help* di belakang setiap perintah (contoh: */add --help* atau */register --help*) untuk melihat rincian format serta parameter yang dibutuhkan.",
  ]);
};
