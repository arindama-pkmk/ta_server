// prisma/seedCategories.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type SeedRow = {
  accountType: string;
  categoryName: string;
  subcategoryName: string;
};

const data: SeedRow[] = [
  // ======= ASET =======
  { accountType: "Aset", categoryName: "Kas", subcategoryName: "Uang Tunai" },
  { accountType: "Aset", categoryName: "Kas", subcategoryName: "Uang Rekening Bank" },
  { accountType: "Aset", categoryName: "Kas", subcategoryName: "Uang E-Wallet" },
  { accountType: "Aset", categoryName: "Piutang", subcategoryName: "Piutang" },
  { accountType: "Aset", categoryName: "Bangunan", subcategoryName: "Rumah" },
  { accountType: "Aset", categoryName: "Bangunan", subcategoryName: "Apartemen" },
  { accountType: "Aset", categoryName: "Bangunan", subcategoryName: "Ruko" },
  { accountType: "Aset", categoryName: "Bangunan", subcategoryName: "Gudang" },
  { accountType: "Aset", categoryName: "Bangunan", subcategoryName: "Kios" },
  { accountType: "Aset", categoryName: "Tanah", subcategoryName: "Properti Sewa" },
  { accountType: "Aset", categoryName: "Peralatan", subcategoryName: "Kendaraan" },
  { accountType: "Aset", categoryName: "Peralatan", subcategoryName: "Elektronik" },
  { accountType: "Aset", categoryName: "Peralatan", subcategoryName: "Furnitur" },
  { accountType: "Aset", categoryName: "Surat Berharga", subcategoryName: "Saham" },
  { accountType: "Aset", categoryName: "Surat Berharga", subcategoryName: "Obligasi" },
  { accountType: "Aset", categoryName: "Surat Berharga", subcategoryName: "Reksadana" },
  { accountType: "Aset", categoryName: "Investasi Alternatif", subcategoryName: "Kripto" },
  { accountType: "Aset", categoryName: "Aset Pribadi", subcategoryName: "Koleksi" },
  { accountType: "Aset", categoryName: "Aset Pribadi", subcategoryName: "Perhiasan" },

  // ==== LIABILITAS ====
  { accountType: "Liabilitas", categoryName: "Utang", subcategoryName: "Saldo Kartu Kredit" },
  { accountType: "Liabilitas", categoryName: "Utang", subcategoryName: "Tagihan" },
  { accountType: "Liabilitas", categoryName: "Utang", subcategoryName: "Cicilan" },
  { accountType: "Liabilitas", categoryName: "Utang", subcategoryName: "Pajak" },
  { accountType: "Liabilitas", categoryName: "Utang Wesel", subcategoryName: "Pinjaman" },
  { accountType: "Liabilitas", categoryName: "Utang Hipotek", subcategoryName: "Pinjaman Properti" },

  // ==== PEMASUKAN ====
  { accountType: "Pemasukan", categoryName: "Pendapatan dari Pekerjaan", subcategoryName: "Gaji" },
  { accountType: "Pemasukan", categoryName: "Pendapatan dari Pekerjaan", subcategoryName: "Upah" },
  { accountType: "Pemasukan", categoryName: "Pendapatan dari Pekerjaan", subcategoryName: "Bonus" },
  { accountType: "Pemasukan", categoryName: "Pendapatan dari Pekerjaan", subcategoryName: "Commission" },
  { accountType: "Pemasukan", categoryName: "Pendapatan dari Investasi", subcategoryName: "Dividen" },
  { accountType: "Pemasukan", categoryName: "Pendapatan Bunga", subcategoryName: "Bunga" },
  { accountType: "Pemasukan", categoryName: "Keuntungan dari Aset", subcategoryName: "Untung Modal" },
  { accountType: "Pemasukan", categoryName: "Pendapatan Jasa", subcategoryName: "Freelance" },

  // ==== PENGELUARAN ====
  { accountType: "Pengeluaran", categoryName: "Tabungan", subcategoryName: "Tabungan" },
  { accountType: "Pengeluaran", categoryName: "Makanan & Minuman", subcategoryName: "Makanan" },
  { accountType: "Pengeluaran", categoryName: "Makanan & Minuman", subcategoryName: "Minuman" },
  { accountType: "Pengeluaran", categoryName: "Hadiah & Donasi", subcategoryName: "Hadiah" },
  { accountType: "Pengeluaran", categoryName: "Hadiah & Donasi", subcategoryName: "Donasi" },
  { accountType: "Pengeluaran", categoryName: "Transportasi", subcategoryName: "Kendaraan Pribadi" },
  { accountType: "Pengeluaran", categoryName: "Transportasi", subcategoryName: "Transportasi Umum" },
  { accountType: "Pengeluaran", categoryName: "Transportasi", subcategoryName: "Bahan bakar" },
  { accountType: "Pengeluaran", categoryName: "Kesehatan & Medis", subcategoryName: "Kesehatan" },
  { accountType: "Pengeluaran", categoryName: "Kesehatan & Medis", subcategoryName: "Medis" },
  { accountType: "Pengeluaran", categoryName: "Perawatan Pribadi & Pakaian", subcategoryName: "Perawatan Pribadi" },
  { accountType: "Pengeluaran", categoryName: "Perawatan Pribadi & Pakaian", subcategoryName: "Pakaian" },
  { accountType: "Pengeluaran", categoryName: "Hiburan & Rekreasi", subcategoryName: "Hiburan" },
  { accountType: "Pengeluaran", categoryName: "Hiburan & Rekreasi", subcategoryName: "Rekreasi" },
  { accountType: "Pengeluaran", categoryName: "Pendidikan & Pembelajaran", subcategoryName: "Pendidikan" },
  { accountType: "Pengeluaran", categoryName: "Pendidikan & Pembelajaran", subcategoryName: "Pembelajaran" },
  { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial", subcategoryName: "Bayar pinjaman" },
  { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial", subcategoryName: "Bayar pajak" },
  { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial", subcategoryName: "Bayar asuransi" },
  { accountType: "Pengeluaran", categoryName: "Perumahan & Kebutuhan", subcategoryName: "Perumahan" },
  { accountType: "Pengeluaran", categoryName: "Perumahan & Kebutuhan", subcategoryName: "Kebutuhan Sehari-hari" },

  // ====== EKUITAS ======
  { accountType: "Ekuitas", categoryName: "Ekuitas", subcategoryName: "Ekuitas" },
];

async function main() {
  // cache maps to avoid duplicate upserts
  const accountTypeCache = new Map<string, { id: string }>();
  const categoryCache = new Map<string, { id: string }>();

  for (const row of data) {
    // 1. upsert AccountType
    let at = accountTypeCache.get(row.accountType);
    if (!at) {
      at = await prisma.accountType.upsert({
        where: { name: row.accountType },
        update: {},
        create: { name: row.accountType },
        select: { id: true },
      });
      accountTypeCache.set(row.accountType, at);
    }

    // 2. upsert Category
    const catKey = `${row.accountType}::${row.categoryName}`;
    let cat = categoryCache.get(catKey);
    if (!cat) {
      cat = await prisma.category.upsert({
        where: {
          uniq_accountType_name: {
            accountTypeId: at.id,
            name: row.categoryName,
          },
        },
        update: {},
        create: {
          accountTypeId: at.id,
          name: row.categoryName,
        },
        select: { id: true },
      });
      categoryCache.set(catKey, cat);
    }

    // 3. upsert Subcategory
    await prisma.subcategory.upsert({
      where: {
        uniq_category_subcategory: {
          categoryId: cat.id,
          name: row.subcategoryName,
        },
      },
      update: {},
      create: {
        categoryId: cat.id,
        name: row.subcategoryName,
      },
    });
  }

  console.log(`Seeded ${data.length} subcategories across account types & categories.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
