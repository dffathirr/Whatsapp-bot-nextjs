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
  "Bank Jago": { code: "WAL010", hint: "Jago" },
  "Bank Jenius": { code: "WAL011", hint: "Jenius" },
} as const;

export const RULE_PERIODS = ["daily", "weekly", "monthly"] as const;
export type RulePeriodType = (typeof RULE_PERIODS)[number];

const keysOf = <T extends Record<string, unknown>>(obj: T) =>
  Object.keys(obj) as [keyof T & string, ...(keyof T & string)[]];

export const TRANSACTION_TYPES = keysOf(TYPE_REF);
export const TRANSACTION_CATEGORIES = keysOf(CATEGORY_REF);
export const WALLET_TYPES = keysOf(WALLET_REF);
export type RefEntry = { readonly code: string; readonly hint: string };
export type RefMap = Readonly<Record<string, RefEntry>>;

export function getRefCode(ref: RefMap, name?: string | null): string | null {
  if (!name) return null;

  const key = name.trim().toLowerCase();
  for (const [refName, entry] of Object.entries(ref)) {
    if (refName.toLowerCase() === key) return entry.code;
  }
  return null;
}

export function getRefNameByCode(ref: RefMap, code?: string | null): string | null {
  if (!code) return null;
  const upperCode = code.trim().toUpperCase();
  for (const [refName, entry] of Object.entries(ref)) {
    if (entry.code.toUpperCase() === upperCode) return refName;
  }
  return null;
}

const WALLET_ALIASES: Record<string, keyof typeof WALLET_REF> = {
  tunai: "Tunai",
  cash: "Tunai",
  bca: "Bank BCA",
  "bank bca": "Bank BCA",
  mbca: "Bank BCA",
  bsi: "Bank BSI",
  "bank bsi": "Bank BSI",
  mandiri: "Bank Mandiri",
  "bank mandiri": "Bank Mandiri",
  livin: "Bank Mandiri",
  dana: "Dana",
  gopay: "Gopay",
  gojek: "Gopay",
  shopeepay: "ShopeePay",
  spay: "ShopeePay",
  shopee: "ShopeePay",
  ovo: "OVO",
  seabank: "SeaBank",
  "sea bank": "SeaBank",
  jago: "Bank Jago",
  "bank jago": "Bank Jago",
  jenius: "Bank Jenius",
  "bank jenius": "Bank Jenius",
};

export function resolveWalletByInput(
  input?: string | null,
): { name: keyof typeof WALLET_REF; code: string } | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  for (const [name, entry] of Object.entries(WALLET_REF)) {
    if (entry.code.toLowerCase() === clean || name.toLowerCase() === clean) {
      return { name: name as keyof typeof WALLET_REF, code: entry.code };
    }
  }

  const aliasMatch = WALLET_ALIASES[clean];
  if (aliasMatch) {
    return { name: aliasMatch, code: WALLET_REF[aliasMatch].code };
  }

  for (const [alias, walletKey] of Object.entries(WALLET_ALIASES)) {
    if (clean.includes(alias)) {
      return { name: walletKey, code: WALLET_REF[walletKey].code };
    }
  }

  return null;
}
