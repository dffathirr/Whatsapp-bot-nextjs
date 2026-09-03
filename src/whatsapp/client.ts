import makeWASocket from "@whiskeysockets/baileys";
import { usePrismaAuthState } from "./auth";
import { AuthenticationState } from "@whiskeysockets/baileys";

export type WhatsappClient = {
  sock: ReturnType<typeof makeWASocket>;
  saveCreds: () => Promise<void>;
};

export async function createWhatsappClient(
  sessionName: string,
): Promise<WhatsappClient> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await usePrismaAuthState(sessionName);

  const sock = makeWASocket({
    auth: state as AuthenticationState,
  });

  return { sock, saveCreds };
}
