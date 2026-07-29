import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const references = [
    { code: 'TRX001', name: 'Pemasukan', group: 'TRANSACTION_TYPE', description: 'Transaksi masuk' },
    { code: 'TRX002', name: 'Pengeluaran', group: 'TRANSACTION_TYPE', description: 'Transaksi keluar' },
    { code: 'TRX003', name: 'Transfer', group: 'TRANSACTION_TYPE', description: 'Transfer' },
    { code: 'TRX004', name: 'Adjustment', group: 'TRANSACTION_TYPE', description: 'Penyesuaian Saldo' },
    
    { code: 'CAT001', name: 'Makanan', group: 'TRANSACTION_CATEGORY', description: 'Kategori makanan' },
    { code: 'CAT002', name: 'Minuman', group: 'TRANSACTION_CATEGORY', description: 'Kategori minuman' },
    { code: 'CAT003', name: 'Internet', group: 'TRANSACTION_CATEGORY', description: 'Kategori internet' },
    { code: 'CAT004', name: 'Rent', group: 'TRANSACTION_CATEGORY', description: 'Kategori sewa' },
    { code: 'CAT005', name: 'Entertainment', group: 'TRANSACTION_CATEGORY', description: 'Kategori hiburan' },
    
    { code: 'WAL001', name: 'Tunai', group: 'WALLET_TYPE', description: 'Dompet tunai' },
    { code: 'WAL002', name: 'Bank BCA', group: 'WALLET_TYPE', description: 'Bank BCA' },
    { code: 'WAL003', name: 'Bank BSI', group: 'WALLET_TYPE', description: 'Bank BSI' },
    { code: 'WAL003', name: 'Bank Mandiri', group: 'WALLET_TYPE', description: 'Bank Mandiri' },
    { code: 'WAL004', name: 'Dana', group: 'WALLET_TYPE', description: 'E-Wallet Dana' },
    { code: 'WAL005', name: 'Gopay', group: 'WALLET_TYPE', description: 'E-Wallet Gopay' },
    { code: 'WAL006', name: 'ShopeePay', group: 'WALLET_TYPE', description: 'E-Wallet ShopeePay' },
    { code: 'WAL007', name: 'OVO', group: 'WALLET_TYPE', description: 'E-Wallet OVO' },
    { code: 'WAL008', name: 'SeaBank', group: 'WALLET_TYPE', description: 'E-Wallet SeaBank' },

    { code: 'WAL009', name: 'Bank Jago', group: 'WALLET_TYPE', description: 'Bank Jago' },
    { code: 'WAL010', name: 'Bank Jenius', group: 'WALLET_TYPE', description: 'Bank Jenius' },
  ]

  console.log('Seeding references...')
  for (const ref of references) {
    const result = await prisma.reference.upsert({
      where: { code: ref.code },
      update: {},
      create: ref,
    })
    console.log(`Upserted reference: ${result.code}`)
  }
  console.log('Seeding done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })