import OpenAI from "openai";
import { serverEnv } from "./server.env";
import z from "zod";
import {
  StandarizationOutput,
  StandarizationOutputSchema,
} from "@/lib/ai.schema";
import { TYPE_REF, CATEGORY_REF, WALLET_REF } from "@/types/ai";

const describeRef = (ref: Record<string, { hint: string }>) =>
  Object.entries(ref)
    .map(([key, { hint }]) => `- ${key}: ${hint}`)
    .join("\n");

export const AI_SYSTEM_BRIEFING = `
Anda adalah parser transaksi keuangan pribadi "BROBOT".
Tugas: ekstrak transaksi dari chat pengguna atau foto struk menjadi JSON sesuai schema.
Keluarkan JSON valid saja, tanpa markdown atau penjelasan.

TIPE TRANSAKSI:
${describeRef(TYPE_REF)}

KATEGORI (pilih tepat satu dari daftar ini):
${describeRef(CATEGORY_REF)}

DOMPET (pilih tepat satu dari daftar ini):
${describeRef(WALLET_REF)}

ATURAN:
- Dompet tidak disebut (misal "beli ayam 35rb"): sourceWallet null, jelaskan singkat di notes.
- Nominal: "k"/"rb" = ribuan (25k -> 25000), "jt" = jutaan (1.5jt -> 1500000).
- TRANSFER: isi sourceWallet dan destinationWallet.
- Pesan chat biasa: receiptMeta null.
`.trim();

const client = new OpenAI({
  baseURL: serverEnv.AI_BASE_URL,
  apiKey: serverEnv.AI_API_KEY,
});

const schemaPrompt = JSON.stringify(z.toJSONSchema(StandarizationOutputSchema));

export async function ParseAi(text: string): Promise<StandarizationOutput> {
  const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" });

  try {
    const completion = await client.chat.completions.create({
      model: serverEnv.AI_MODEL,
      messages: [
        {
          role: "system",
          content: [
            AI_SYSTEM_BRIEFING,
            `Waktu sekarang (WIB): ${now}. Pakai ini untuk kata seperti "kemarin" atau "tadi pagi"; jika tanggal tidak disebut, pakai waktu sekarang.`,
            `Output harus sesuai JSON Schema ini: ${schemaPrompt}`,
          ].join("\n\n"),
        },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const choice = completion.choices[0];
    if (choice.finish_reason === "length") {
      throw new Error("Output terpotong, naikkan max_tokens");
    }

    const raw = (choice.message.content ?? "")
      .replace(/^```(?:json)?\s*|\s*```$/g, "")
      .trim();

    return StandarizationOutputSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.error("ParseAi gagal:", error);
    return {
      intent: "UNKNOWN",
      transaction: null,
      confidence: 0,
      notes: "Gagal memproses pesan",
    };
  }
}

console.log("ParseAi", await ParseAi("saya beli susu 5000"));
