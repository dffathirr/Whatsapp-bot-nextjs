import { DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode-terminal";
import { createWhatsappClient } from "./client";
import mainEvent from "./event";
import Route from "./route";

async function startWhatsapp() {
  const { sock, saveCreds } = await createWhatsappClient("default_session");

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      QRCode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected");
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection Closed");

      if (shouldReconnect) {
        startWhatsapp();
      }
    }
  });

  mainEvent(sock, (msg) => Route(sock, msg));
}

startWhatsapp().catch(console.error);
