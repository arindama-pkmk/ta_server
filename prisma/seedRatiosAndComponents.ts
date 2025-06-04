// prisma/seedRatiosAndComponents.ts
import { PrismaClient, Side } from "@prisma/client";
const prisma = new PrismaClient();

// Definitions from your Flutter code
const subcategoryDefinitions = {
  liquidCats: ['Uang Tunai', 'Uang Rekening Bank', 'Uang E-Wallet', 'Dividen', 'Bunga', 'Untung Modal'],
  nonLiquidCats: ['Piutang', 'Rumah', 'Apartemen', 'Ruko', 'Gudang', 'Kios', 'Properti Sewa', 'Kendaraan', 'Elektronik', 'Furnitur', 'Saham', 'Obligasi', 'Reksadana', 'Kripto', 'Koleksi', 'Perhiasan'],
  liabilitiesCats: ['Saldo Kartu Kredit', 'Tagihan', 'Cicilan', 'Pajak', 'Pinjaman', 'Pinjaman Properti'],
  expenseCats: ['Tabungan', 'Makanan', 'Minuman', 'Hadiah', 'Donasi', 'Kendaraan Pribadi', 'Transportasi Umum', 'Bahan bakar', 'Kesehatan', 'Medis', 'Perawatan Pribadi', 'Pakaian', 'Hiburan', 'Rekreasi', 'Pendidikan', 'Pembelajaran', 'Bayar pinjaman', 'Bayar pajak', 'Bayar asuransi', 'Perumahan', 'Kebutuhan Sehari-hari'],
  incomeCats: ['Gaji', 'Upah', 'Bonus', 'Commission', 'Dividen', 'Bunga', 'Untung Modal', 'Freelance'],
  savingsCats: ['Tabungan'],
  debtPaymentsCats: ['Cicilan', 'Saldo Kartu Kredit', 'Pinjaman', 'Pinjaman Properti', 'Bayar pinjaman'], // Added Bayar pinjaman
  deductionsCats: ['Pajak', 'Bayar asuransi'], // Note: Pajak here refers to income tax deduction, Bayar pajak expense
  investedCats: ['Saham', 'Obligasi', 'Reksadana', 'Kripto', 'Properti Sewa'],
};

// Helper to ensure all subcategories from definitions exist
const allDefinedSubcategoryNames = [
  ...new Set(Object.values(subcategoryDefinitions).flat())
];


type RatioDefinition = {
  code: string; // Unique code for the ratio
  title: string;
  multiplier?: number;
  lowerBound?: number;
  upperBound?: number;
  isLowerBoundInclusive?: boolean; // Optional, default is true
  isUpperBoundInclusive?: boolean; // Optional, default is true
  // Components structure:
  // 'conceptual_sum_name': [{ subcategoryName: string, sign: 1 | -1 }, ...]
  // Then formula structure:
  // numerator: ['conceptual_sum_name1', 'conceptual_sum_name2_with_operator_if_needed']
  // denominator: ['conceptual_sum_name3']
  // This structure is complex to directly map to RatioComponent side (num/den)
  // Simpler: directly list subcategories for numerator and denominator
  components: Array<{
    subcategoryName: string;
    side: Side;
    sign: 1 | -1;
  }>;
};

const ratioData: RatioDefinition[] = [
  { // 0: Liquidity Ratio (months)
    code: "LIQUIDITY_RATIO",
    title: "Rasio Likuiditas", // Matches table II.1
    multiplier: 1, // Unit is months
    lowerBound: 3,
    components: [
      // Numerator: Aset Likuid (s.liquid)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      // Denominator: Pengeluaran bulanan (s.expense)
      ...subcategoryDefinitions.expenseCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
    ],
  },
  { // 1: Current Assets / Net Worth (%)
    code: "LIQUID_ASSETS_TO_NET_WORTH_RATIO",
    title: "Rasio aset lancar terhadap kekayaan bersih", // Matches table II.1
    multiplier: 100,
    lowerBound: 15,
    components: [
      // Numerator: Aset Likuid (s.liquid)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      // Denominator: Total Kekayaan Bersih (s.netWorth = (s.liquid + s.nonLiquid) - s.liabilities)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.nonLiquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.liabilitiesCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: -1 } as const)),
    ],
  },
  { // 2: Debt-to-Asset (%)
    code: "DEBT_TO_ASSET_RATIO",
    title: "Rasio utang terhadap aset", // Matches table II.1
    multiplier: 100,
    upperBound: 50,
    components: [
      // Numerator: Total Utang (s.liabilities)
      ...subcategoryDefinitions.liabilitiesCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      // Denominator: Total Aset (s.totalAssets = s.liquid + s.nonLiquid)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.nonLiquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
    ],
  },
  { // 3: Saving Ratio (%)
    code: "SAVING_RATIO",
    title: "Rasio Tabungan", // Matches table II.1
    multiplier: 100,
    lowerBound: 10,
    components: [
      // Numerator: Total Tabungan (s.savings)
      ...subcategoryDefinitions.savingsCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      // Denominator: Penghasilan Kotor (s.income)
      ...subcategoryDefinitions.incomeCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
    ],
  },
  { // 4: Debt Service Ratio (%)
    code: "DEBT_SERVICE_RATIO",
    title: "Rasio kemampuan pelunasan hutang", // Matches table II.1
    multiplier: 100,
    upperBound: 45,
    components: [
      // Numerator: Total Pembayaran Utang (s.debtPayments)
      ...subcategoryDefinitions.debtPaymentsCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      // Denominator: Penghasilan Bersih (s.netIncome = s.income - s.deductions)
      ...subcategoryDefinitions.incomeCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.deductionsCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: -1 } as const)),
    ],
  },
  { // 5: Net investment asset to net worth ratio (%)
    code: "INVESTMENT_ASSETS_TO_NET_WORTH_RATIO",
    title: "Aset investasi terhadap nilai bersih kekayaan", // Matches table II.1
    multiplier: 100,
    lowerBound: 50,
    components: [
      // Numerator: Total Aset Diinvestasikan (s.invested)
      ...subcategoryDefinitions.investedCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      // Denominator: Total Kekayaan Bersih (s.netWorth)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.nonLiquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.liabilitiesCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: -1 } as const)),
    ],
  },
  { // 6: Solvency Ratio (%)
    code: "SOLVENCY_RATIO",
    title: "Rasio solvabilitas", // Matches table II.1
    multiplier: 100,
    // No explicit ideal bound in the table, indicates "bangkrut jika utang > aset"
    // Which means net worth < 0. So, ideal is net worth / total assets > 0.
    // We can set lowerBound: 0, or handle this via custom logic if Prisma ideal check needs it.
    // For now, following `isIdeal: (_) => false` from Flutter (no specific ideal range).
    // If ideal is > 0, then lowerBound: 0 (exclusive).
    // Or if we interpret it as "not bankrupt", then the ratio should be positive.
    // Let's assume "not bankrupt" means Solvency Ratio > 0%
    lowerBound: 0, // A very small positive number to represent >0
    isLowerBoundInclusive: false, // Not bankrupt means net worth > 0
    components: [
      // Numerator: Total Kekayaan Bersih (s.netWorth)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      ...subcategoryDefinitions.nonLiquidCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: 1 } as const)),
      ...subcategoryDefinitions.liabilitiesCats.map(sc => ({ subcategoryName: sc, side: Side.numerator, sign: -1 } as const)),
      // Denominator: Total Aset (s.totalAssets)
      ...subcategoryDefinitions.liquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
      ...subcategoryDefinitions.nonLiquidCats.map(sc => ({ subcategoryName: sc, side: Side.denominator, sign: 1 } as const)),
    ],
  },
];

async function main() {
  console.log(`Start seeding Ratios and RatioComponents ...`);

  // Fetch all subcategories from DB to get their IDs
  const dbSubcategories = await prisma.subcategory.findMany({ select: { id: true, name: true } });
  const subcategoryMap = new Map(dbSubcategories.map(sc => [sc.name, sc.id]));

  // Verify all defined subcategories exist in the DB
  for (const scName of allDefinedSubcategoryNames) {
    if (!subcategoryMap.has(scName)) {
      console.error(`FATAL: Subcategory "${scName}" defined in ratio logic but not found in DB. Please run seedCategoriesAndSubcategories.ts and ensure it's included.`);
      process.exit(1);
    }
  }


  for (const ratioDef of ratioData) {
    const ratio = await prisma.ratio.upsert({
      where: { code: ratioDef.code },
      update: {
        title: ratioDef.title,
        multiplier: ratioDef.multiplier ?? 100, // Default to 100 if not specified
        lowerBound: ratioDef.lowerBound ?? 0,
        upperBound: ratioDef.upperBound ?? 100,
      },
      create: {
        code: ratioDef.code,
        title: ratioDef.title,
        multiplier: ratioDef.multiplier ?? 100,
        lowerBound: ratioDef.lowerBound ?? 0,
        upperBound: ratioDef.upperBound ?? 100,
      },
    });
    console.log(`Upserted Ratio: ${ratio.title} (ID: ${ratio.id})`);

    for (const compDef of ratioDef.components) {
      const subcategoryId = subcategoryMap.get(compDef.subcategoryName);
      if (!subcategoryId) {
        // This should ideally not happen if seedCategories is comprehensive
        console.warn(`Subcategory "${compDef.subcategoryName}" not found in map for Ratio "${ratio.title}". Skipping component.`);
        continue;
      }

      await prisma.ratioComponent.upsert({
        where: {
          uniq_ratio_subcategory_side: { // Use the correct unique constraint name
            ratioId: ratio.id,
            subcategoryId: subcategoryId,
            side: compDef.side,
            // If side is part of the unique key, include it.
            // My schema has @@unique([ratioId, subcategoryId])
            // This implies a subcategory can only be on one side for a ratio,
            // or its sign/side is an attribute, not part of uniqueness for the pair.
            // Current schema is fine if a subcategory is ONLY ever num OR den for a ratio.
            // If subcategory 'X' can be +X in numerator and also -X in denominator
            // for the *same ratio*, then the unique constraint needs side.
            // Given the formulas, a subcategory's role (e.g. part of "Liquid Assets") is fixed.
          }
        },
        update: {
          side: compDef.side,
          sign: compDef.sign,
        },
        create: {
          ratioId: ratio.id,
          subcategoryId: subcategoryId,
          side: compDef.side,
          sign: compDef.sign,
        },
      });
      console.log(`  Upserted RatioComponent for ${compDef.subcategoryName} (Side: ${compDef.side}, Sign: ${compDef.sign})`);
    }
  }

  console.log(`Seeding Ratios and RatioComponents finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });