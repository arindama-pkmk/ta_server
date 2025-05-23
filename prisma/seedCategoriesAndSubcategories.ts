// prisma/seedCategoriesAndSubcategories.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type SeedRow = {
  accountType: string;
  categoryName: string;
  subcategoryName: string;
};

// ======= YOUR ORIGINAL DATA =======
const originalSeedData: SeedRow[] = [
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
  { accountType: "Liabilitas", categoryName: "Utang", subcategoryName: "Pajak" }, // Pajak as a liability
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
  { accountType: "Pengeluaran", categoryName: "Tabungan", subcategoryName: "Tabungan" }, // Saving is an expense cash flow
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
  { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial", subcategoryName: "Bayar pajak" }, // Paying tax is an expense
  { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial", subcategoryName: "Bayar asuransi" },
  { accountType: "Pengeluaran", categoryName: "Perumahan & Kebutuhan", subcategoryName: "Perumahan" },
  { accountType: "Pengeluaran", categoryName: "Perumahan & Kebutuhan", subcategoryName: "Kebutuhan Sehari-hari" },

  // ====== EKUITAS ======
  { accountType: "Ekuitas", categoryName: "Ekuitas", subcategoryName: "Ekuitas" }, // General equity placeholder
];
// ======= END OF YOUR ORIGINAL DATA =======


// Subcategory lists from your Flutter evaluation_calculator.dart
const subcategoryDefinitionsForRatios = {
  liquidCats: ['Uang Tunai', 'Uang Rekening Bank', 'Uang E-Wallet', 'Dividen', 'Bunga', 'Untung Modal'],
  nonLiquidCats: ['Piutang', 'Rumah', 'Apartemen', 'Ruko', 'Gudang', 'Kios', 'Properti Sewa', 'Kendaraan', 'Elektronik', 'Furnitur', 'Saham', 'Obligasi', 'Reksadana', 'Kripto', 'Koleksi', 'Perhiasan'],
  liabilitiesCats: ['Saldo Kartu Kredit', 'Tagihan', 'Cicilan', 'Pajak', 'Pinjaman', 'Pinjaman Properti'],
  expenseCats: ['Tabungan', 'Makanan', 'Minuman', 'Hadiah', 'Donasi', 'Kendaraan Pribadi', 'Transportasi Umum', 'Bahan bakar', 'Kesehatan', 'Medis', 'Perawatan Pribadi', 'Pakaian', 'Hiburan', 'Rekreasi', 'Pendidikan', 'Pembelajaran', 'Bayar pinjaman', 'Bayar pajak', 'Bayar asuransi', 'Perumahan', 'Kebutuhan Sehari-hari'],
  incomeCats: ['Gaji', 'Upah', 'Bonus', 'Commission', 'Dividen', 'Bunga', 'Untung Modal', 'Freelance'],
};

const allRatioSubcategoryNames = [
  ...new Set(Object.values(subcategoryDefinitionsForRatios).flat())
];

// Combine original data with any missing subcategories from ratio definitions
const finalSeedData: SeedRow[] = [...originalSeedData];
const existingSeedSubcategoryNames = new Set(originalSeedData.map(d => d.subcategoryName));

allRatioSubcategoryNames.forEach(ratioSubName => {
  if (!existingSeedSubcategoryNames.has(ratioSubName)) {
    console.warn(`Subcategory "${ratioSubName}" (from ratio definitions) is not in original seed data. It will NOT be added automatically. Please ensure all subcategories needed for ratios are in the originalSeedData array with correct AccountType and Category.`);
    // Decide on a strategy:
    // 1. Warn and skip (current implementation)
    // 2. Try to auto-assign (more complex, error-prone if names are ambiguous)
    // Example of auto-assigning to a generic "Lainnya" category if desired:
    /*
    if (subcategoryDefinitionsForRatios.incomeCats.includes(ratioSubName)) {
        finalSeedData.push({ accountType: "Pemasukan", categoryName: "Pendapatan Lainnya", subcategoryName: ratioSubName });
    } else if (subcategoryDefinitionsForRatios.expenseCats.includes(ratioSubName)) {
        finalSeedData.push({ accountType: "Pengeluaran", categoryName: "Pengeluaran Lainnya", subcategoryName: ratioSubName });
    } else if (subcategoryDefinitionsForRatios.liabilitiesCats.includes(ratioSubName)) {
        finalSeedData.push({ accountType: "Liabilitas", categoryName: "Utang Lainnya", subcategoryName: ratioSubName });
    } else { // Assume Aset if not in others
        finalSeedData.push({ accountType: "Aset", categoryName: "Aset Lainnya", subcategoryName: ratioSubName });
    }
    console.log(`Added missing ratio subcategory: ${ratioSubName} to a default category.`);
    */
  }
});

// Deduplicate finalSeedData (though originalSeedData should be unique by structure)
const uniqueFinalSeedData = Array.from(new Map(finalSeedData.map(item =>
  [`${item.accountType}-${item.categoryName}-${item.subcategoryName}`, item]
)).values());


async function main() {
  console.log(`Start seeding account types, categories, and subcategories using original name definitions...`);
  const accountTypeCache = new Map<string, { id: string }>();
  const categoryCache = new Map<string, { id: string; name: string; accountTypeId: string }>();
  const subcategoryCache = new Map<string, { id: string; name: string; categoryId: string }>();

  for (const row of uniqueFinalSeedData) {
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
      // console.log(`Upserted AccountType: ${row.accountType} (ID: ${at.id})`);
    }

    // 2. upsert Category
    const catKey = `${at.id}::${row.categoryName}`;
    let cat = categoryCache.get(catKey);
    if (!cat) {
      const newCat = await prisma.category.upsert({
        where: {
          uniq_category_account_type: {
            accountTypeId: at.id,
            name: row.categoryName,
          },
        },
        update: {},
        create: {
          accountTypeId: at.id,
          name: row.categoryName,
        },
        select: { id: true, name: true, accountTypeId: true },
      });
      categoryCache.set(catKey, newCat);
      cat = newCat;
      // console.log(`Upserted Category: ${row.categoryName} under ${row.accountType} (ID: ${cat.id})`);
    }

    // 3. upsert Subcategory
    const subcatKey = `${cat.id}::${row.subcategoryName}`;
    if (!subcategoryCache.has(subcatKey)) { // Check local cache before hitting DB
      const newSubcat = await prisma.subcategory.upsert({
        where: {
          uniq_subcategory_category: {
            categoryId: cat.id,
            name: row.subcategoryName,
          },
        },
        update: {},
        create: {
          categoryId: cat.id,
          name: row.subcategoryName,
        },
        select: { id: true, name: true, categoryId: true }
      });
      subcategoryCache.set(subcatKey, newSubcat);
      // console.log(`Upserted Subcategory: ${row.subcategoryName} under ${row.categoryName} (ID: ${newSubcat.id})`);
    }
  }

  console.log(`Seeded ${uniqueFinalSeedData.length} unique subcategories based on original definitions.`);
  console.log(`Total AccountTypes in cache: ${accountTypeCache.size}`);
  console.log(`Total Categories in cache: ${categoryCache.size}`);
  console.log(`Total Subcategories in cache: ${subcategoryCache.size}`);
  console.log(`Seeding categories and subcategories finished.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });