import { WASocket } from "@whiskeysockets/baileys";

export async function sendGreeting(sock: WASocket, jid: string, name?: string) {
  const text = [
    `👋 *Halo${name ? `, ${name}` : ""}! Selamat datang di BROBOT*`,
    "Saya adalah asisten otomatis untuk mencatat transaksi dan memantau keuangan Anda langsung dari WhatsApp.",
    "",
    "Ketik */help* untuk melihat daftar perintah yang tersedia.",
  ].join("\n");

  await sock.sendMessage(jid, { text });
}

export async function sendHelp(sock: WASocket, jid: string) {
  const text = [
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
  ].join("\n");

  await sock.sendMessage(jid, { text });
}
