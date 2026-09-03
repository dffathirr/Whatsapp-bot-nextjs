import { IncomingMessage } from "@/types/baileys";
import { WAMessage, WASocket } from "@whiskeysockets/baileys";

export default function mainEvent(sock: WASocket, onMessage: (msg: IncomingMessage) => void) {
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];

    if (!msg.message) return;

    if (msg.key.fromMe) return;

    const sumMsg = mapIncomingMessage(msg);

    console.log("sumMsg", sumMsg);

    onMessage(sumMsg);
  });
}

export function mapIncomingMessage(msg: WAMessage): IncomingMessage {
  const jid = msg.key.remoteJid ?? "";
  const isGroup = jid.endsWith("@g.us");
  const isPrivate = jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid");

  return {
    id: msg.key.id ?? "",
    jid,
    fromNumber:
      msg.key.remoteJidAlt?.replace("@s.whatsapp.net", "") ??
      msg.key.participantAlt?.replace("@s.whatsapp.net", ""),
    fromName: msg.pushName ?? "",
    type: isGroup ? "Group" : isPrivate ? "Personal" : "Unknown",
    text:
      msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? "",
  };
}
