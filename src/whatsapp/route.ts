import { IncomingMessage } from "@/types/baileys";
import { WASocket } from "@whiskeysockets/baileys";
import { parseCommand } from "./parser";
import RegisterCommand from "./commands/register.command";
import LoginCommand from "./commands/login.command";
import { ResponseMessage, sendGreeting, sendHelp } from "./response";

export default async function Route(sock: WASocket, msg: IncomingMessage) {
  if (!msg.text?.trim() || !msg.jid) return;

  // Jika pesan berada di grup dan bukan command, abaikan agar tidak spam
  if (msg.type === "Group" && !msg.text.trim().startsWith("/")) return;

  const parsed = parseCommand(msg.text);

  // Jika bukan command (chat biasa tanpa awalan '/'), kirim greeting message
  if (!parsed) {
    await sendGreeting(sock, msg.jid, msg.fromName);
    return;
  }

  switch (parsed.command) {
    case "help":
      await sendHelp(sock, msg.jid);
      break;
    case "register":
      await RegisterCommand(sock, msg, parsed);
      break;
    case "login":
      await LoginCommand(sock, msg, parsed);
      break;
    case "add":
      console.log("add");
      break;
    case "buy":
      console.log("buy");
      break;
    case "tf":
      console.log("tf");
      break;
    case "adjust":
      console.log("adjust");
      break;
    default:
      await ResponseMessage(
        sock,
        msg.jid,
        `❓ Perintah */${parsed.command}* tidak dikenali.\n\nKetik */help* untuk melihat daftar perintah yang tersedia.`,
      );
      break;
  }
}
