import {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  WALLET_TYPES,
} from "@/types/ai";
import { z } from "zod";

const TransactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),

    amount: z
      .number()
      .positive()
      .describe("Angka murni tanpa titik, koma, atau simbol. Contoh: 35000"),

    category: z.enum(TRANSACTION_CATEGORIES),

    sourceWallet: z
      .enum(WALLET_TYPES)
      .nullish()
      .describe("Isi null jika pengguna tidak menyebut dompet."),

    destinationWallet: z
      .enum(WALLET_TYPES)
      .nullish()
      .describe("Hanya untuk TRANSFER (dompet tujuan), selain itu null."),

    description: z
      .string()
      .describe('Catatan ringkas transaksi, misal: "Beli ayam 1 ekor"'),

    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      .describe(
        'Format "YYYY-MM-DD HH:mm:ss" (WIB), pakai spasi tanpa huruf T. Pakai waktu sekarang jika tidak disebut.',
      ),

    receiptMeta: z
      .object({
        merchantName: z.string().nullish().describe("Nama toko di struk"),
        items: z
          .array(
            z.object({
              name: z.string(),
              qty: z.number().nullish(),
              price: z.number().nullish(),
            }),
          )
          .nullish()
          .describe("Rincian item jika terbaca pada struk"),
      })
      .nullish()
      .describe(
        "Hanya diisi jika input foto struk/invoice. Untuk chat biasa isi null.",
      ),
  })
  .superRefine((tx, ctx) => {
    if (tx.type === "TRANSFER" && !tx.destinationWallet) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationWallet"],
        message: "destinationWallet wajib diisi untuk TRANSFER",
      });
    }
  });

export const StandarizationOutputSchema = z
  .object({
    intent: z
      .enum(["TRANSACTION", "QUERY_BALANCE", "CHITCHAT", "UNKNOWN"])
      .describe(
        "TRANSACTION: mencatat pengeluaran/pemasukan/transfer. " +
          "QUERY_BALANCE: menanyakan saldo. " +
          "CHITCHAT: sapaan/obrolan santai. " +
          "UNKNOWN: pesan tidak jelas.",
      ),

    transaction: TransactionSchema.nullable().describe(
      "Wajib diisi jika intent TRANSACTION, selain itu null.",
    ),

    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Tingkat kepastian ekstraksi, 0.0 sampai 1.0"),

    notes: z
      .string()
      .nullish()
      .describe(
        'Catatan jika ada yang ambigu, misal: "Dompet tidak disebutkan"',
      ),
  })
  .refine((d) => d.intent !== "TRANSACTION" || d.transaction !== null, {
    path: ["transaction"],
    message: "transaction wajib diisi jika intent TRANSACTION",
  });

export type StandarizationOutput = z.infer<typeof StandarizationOutputSchema>;
export type StandarizationTransaction = NonNullable<
  StandarizationOutput["transaction"]
>;
