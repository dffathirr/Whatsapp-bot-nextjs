export const TYPE_REF = {
  EXPENSE: { code: "TRX002", hint: "pengeluaran: beli, jajan, bayar tagihan" },
  INCOME: { code: "TRX001", hint: "pemasukan: gaji, bonus, uang masuk" },
  TRANSFER: { code: "TRX003", hint: "pindah saldo antar dompet/bank" },
  ADJUSTMENT: { code: "TRX004", hint: "koreksi/penyesuaian saldo fisik" },
} as const;

export const CATEGORY_REF = {
  Makanan: {
    code: "CAT001",
    hint: "makanan pokok, lauk, cemilan, sarapan, makan malam, sembako",
  },
  Minuman: { code: "CAT002", hint: "kopi, teh, jus, air mineral/galon, boba" },
  Internet: {
    code: "CAT003",
    hint: "pulsa, paket data, tagihan wifi/indihome",
  },
  Rent: { code: "CAT004", hint: "sewa kos, kontrakan, sewa tempat" },
  Entertainment: {
    code: "CAT005",
    hint: "bioskop, game, liburan, streaming (Netflix/Spotify)",
  },
  Lainnya: {
    code: "CAT099",
    hint: "pakai ini jika tidak cocok dengan kategori lain",
  },
} as const;

export const WALLET_REF = {
  Tunai: {
    code: "WAL001",
    hint: "uang fisik/cash (DEFAULT jika dompet tidak disebut)",
  },
  "Bank BCA": { code: "WAL002", hint: "BCA / m-BCA / KlikBCA" },
  "Bank BSI": { code: "WAL003", hint: "BSI / Bank Syariah Indonesia" },
  "Bank Mandiri": { code: "WAL004", hint: "Mandiri / Livin" },
  Dana: { code: "WAL005", hint: "e-wallet Dana" },
  Gopay: { code: "WAL006", hint: "Gojek / Gopay" },
  ShopeePay: { code: "WAL007", hint: "Shopee / ShopeePay / SPay" },
  OVO: { code: "WAL008", hint: "e-wallet OVO" },
  SeaBank: { code: "WAL009", hint: "SeaBank" },
  "Bank Jago": { code: "WAL0010", hint: "Jago" },
  "Bank Jenius": { code: "WAL011", hint: "Jenius" },
} as const;

const keysOf = <T extends Record<string, unknown>>(obj: T) =>
  Object.keys(obj) as [keyof T & string, ...(keyof T & string)[]];

export const TRANSACTION_TYPES = keysOf(TYPE_REF);
export const TRANSACTION_CATEGORIES = keysOf(CATEGORY_REF);
export const WALLET_TYPES = keysOf(WALLET_REF);
