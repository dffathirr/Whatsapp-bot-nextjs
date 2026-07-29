import { startWhatsapp } from "./client";

async function main() {
  await startWhatsapp();
}

main().catch(console.error);
