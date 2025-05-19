// prisma/seedCategoryOccupations.ts
import { PrismaClient, Category, Occupation } from "@prisma/client";
const prisma = new PrismaClient();

// Based on "Tabel II. 2 Alokasi Dana Berdasarkan Situasi Kehidupan"
// And mapping to your seeded Category names.
// IMPORTANT: Category names here MUST match those seeded in seedCategoriesAndSubcategories.ts
// For simplicity, I'm using the more generic category names defined in seedCategoriesAndSubcategories.ts
// You might need to adjust these mappings if your actual category names for budgeting differ.

type CategoryOccupationSeed = {
  occupationName: string; // Must match names in seedOccupations.ts
  categoryName: string;   // Must match Expense Category names in seedCategoriesAndSubcategories.ts
  lowerBound?: number;    // Percentage
  upperBound?: number;    // Percentage
};

const data: CategoryOccupationSeed[] = [
  // Pelajar/Mahasiswa
  // Kategori Pengeluaran from table: Rumah -> Maps to your app's Pengeluaran Category: "Perumahan & Kebutuhan"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Perumahan & Kebutuhan", upperBound: 25 },
  // Kategori: Transportasi -> Maps to your app's Pengeluaran Category: "Transportasi"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Transportasi", lowerBound: 5, upperBound: 10 },
  // Kategori: Makan -> Maps to your app's Pengeluaran Category: "Makanan & Minuman"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Makanan & Minuman", lowerBound: 15, upperBound: 20 },
  // Kategori: Pakaian -> Maps to your app's Pengeluaran Category: "Perawatan Pribadi & Pakaian"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Perawatan Pribadi & Pakaian", lowerBound: 5, upperBound: 12 },
  // Kategori: Kesehatan -> Maps to your app's Pengeluaran Category: "Kesehatan & Medis"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Kesehatan & Medis", lowerBound: 3, upperBound: 5 },
  // Kategori: Hiburan dan ekspresi -> Maps to your app's Pengeluaran Category: "Hiburan & Rekreasi"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Hiburan & Rekreasi", lowerBound: 5, upperBound: 10 },
  // Kategori: Pendidikan -> Maps to your app's Pengeluaran Category: "Pendidikan & Pembelajaran"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Pendidikan & Pembelajaran", lowerBound: 10, upperBound: 30 },
  // Kategori: Asuransi dan Pensiun -> Maps to your app's Pengeluaran Category for Asuransi: "Kewajiban Finansial" (if "Bayar asuransi" is under it) or a dedicated "Asuransi" category if you have one for Pengeluaran.
  // For "Kewajiban Finansial" if it contains "Bayar asuransi":
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Kewajiban Finansial", upperBound: 5 }, // Assuming this covers Asuransi part
  // Kategori: Sosial -> Maps to your app's Pengeluaran Category: "Hadiah & Donasi"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Hadiah & Donasi", lowerBound: 4, upperBound: 6 },
  // Kategori: Tabungan -> Maps to your app's Pengeluaran Category: "Tabungan"
  { occupationName: "Pelajar/Mahasiswa", categoryName: "Tabungan", upperBound: 10 },

  // Pekerja - Apply similar mapping logic
  { occupationName: "Pekerja", categoryName: "Perumahan & Kebutuhan", lowerBound: 30, upperBound: 35 },
  { occupationName: "Pekerja", categoryName: "Transportasi", lowerBound: 15, upperBound: 20 },
  { occupationName: "Pekerja", categoryName: "Makanan & Minuman", lowerBound: 15, upperBound: 25 },
  { occupationName: "Pekerja", categoryName: "Perawatan Pribadi & Pakaian", lowerBound: 5, upperBound: 15 },
  { occupationName: "Pekerja", categoryName: "Kesehatan & Medis", lowerBound: 3, upperBound: 5 },
  { occupationName: "Pekerja", categoryName: "Hiburan & Rekreasi", lowerBound: 5, upperBound: 10 },
  { occupationName: "Pekerja", categoryName: "Pendidikan & Pembelajaran", lowerBound: 2, upperBound: 4 },
  { occupationName: "Pekerja", categoryName: "Kewajiban Finansial", lowerBound: 4, upperBound: 8 }, // Assuming this covers Asuransi & Pensiun
  { occupationName: "Pekerja", categoryName: "Hadiah & Donasi", lowerBound: 5, upperBound: 8 },
  { occupationName: "Pekerja", categoryName: "Tabungan", lowerBound: 4, upperBound: 15 },

  // Suami/Istri - Apply similar mapping logic
  { occupationName: "Suami/Istri", categoryName: "Perumahan & Kebutuhan", lowerBound: 25, upperBound: 35 },
  { occupationName: "Suami/Istri", categoryName: "Transportasi", lowerBound: 15, upperBound: 20 },
  { occupationName: "Suami/Istri", categoryName: "Makanan & Minuman", lowerBound: 15, upperBound: 25 },
  { occupationName: "Suami/Istri", categoryName: "Perawatan Pribadi & Pakaian", lowerBound: 5, upperBound: 10 },
  { occupationName: "Suami/Istri", categoryName: "Kesehatan & Medis", lowerBound: 4, upperBound: 10 },
  { occupationName: "Suami/Istri", categoryName: "Hiburan & Rekreasi", lowerBound: 4, upperBound: 8 },
  { occupationName: "Suami/Istri", categoryName: "Pendidikan & Pembelajaran", lowerBound: 3, upperBound: 5 },
  { occupationName: "Suami/Istri", categoryName: "Kewajiban Finansial", lowerBound: 5, upperBound: 9 }, // Assuming this covers Asuransi & Pensiun
  { occupationName: "Suami/Istri", categoryName: "Hadiah & Donasi", lowerBound: 3, upperBound: 5 },
  { occupationName: "Suami/Istri", categoryName: "Tabungan", lowerBound: 5, upperBound: 10 },
];

// ... (rest of the main function from the previous seedCategoryOccupations.ts remains the same)
// The main function correctly fetches Expense categories and maps by name.
// Ensure the category names in `data` above are exact matches to your Pengeluaran categories.

async function main() {
  console.log(`Start seeding CategoryOccupations using original name definitions...`);

  const occupations = await prisma.occupation.findMany({ select: { id: true, name: true } });
  const expenseAccountType = await prisma.accountType.findUnique({ where: { name: "Pengeluaran" }, select: { id: true } });

  if (!expenseAccountType) {
    console.error("AccountType 'Pengeluaran' not found. Please ensure it is seeded by seedCategoriesAndSubcategories.ts.");
    return;
  }

  const expenseCategories = await prisma.category.findMany({
    where: { accountTypeId: expenseAccountType.id },
    select: { id: true, name: true }
  });

  const occupationMap = new Map(occupations.map(o => [o.name, o.id]));
  const categoryMap = new Map(expenseCategories.map(c => [c.name, c.id]));

  for (const item of data) {
    const occupationId = occupationMap.get(item.occupationName);
    const categoryId = categoryMap.get(item.categoryName);

    if (!occupationId) {
      console.warn(`Occupation "${item.occupationName}" not found. Skipping CategoryOccupation seed for category "${item.categoryName}".`);
      continue;
    }
    if (!categoryId) {
      // This is a critical warning. The categoryName in 'data' must exist as an "Pengeluaran" category.
      console.warn(`Expense Category "${item.categoryName}" (for occupation "${item.occupationName}") not found in the database under 'Pengeluaran' AccountType. Skipping this CategoryOccupation seed. Please verify names in originalSeedData and this file.`);
      continue;
    }

    await prisma.categoryOccupation.upsert({
      where: {
        uniq_category_occupation: {
          categoryId: categoryId,
          occupationId: occupationId,
        },
      },
      update: {
        lowerBound: item.lowerBound ?? 0,
        upperBound: item.upperBound ?? 100,
      },
      create: {
        categoryId: categoryId,
        occupationId: occupationId,
        lowerBound: item.lowerBound ?? 0,
        upperBound: item.upperBound ?? 100,
      },
    });
    console.log(`Upserted CategoryOccupation for ${item.occupationName} - ${item.categoryName}`);
  }

  console.log(`Seeding CategoryOccupations finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });