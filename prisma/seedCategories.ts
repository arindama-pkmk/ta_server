// prisma/seedCategories.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    type Cat = { accountType: string; categoryName: string; subcategoryName: string };
    const data: Cat[] = [
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
        { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial (pinjaman, pajak, asuransi)", subcategoryName: "Bayar pinjaman" },
        { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial (pinjaman, pajak, asuransi)", subcategoryName: "Bayar pajak" },
        { accountType: "Pengeluaran", categoryName: "Kewajiban Finansial (pinjaman, pajak, asuransi)", subcategoryName: "Bayar asuransi" },
        { accountType: "Pengeluaran", categoryName: "Perumahan dan Kebutuhan Sehari-hari", subcategoryName: "Perumahan" },
        { accountType: "Pengeluaran", categoryName: "Perumahan dan Kebutuhan Sehari-hari", subcategoryName: "Kebutuhan Sehari-hari" },

        // ====== EKUITAS ======
        { accountType: "Ekuitas", categoryName: "Ekuitas", subcategoryName: "Ekuitas" },
    ];

    for (const c of data) {
        await prisma.category.upsert({
            where: {
                uniq_account_category_subcategory: {
                    accountType: c.accountType,
                    categoryName: c.categoryName,
                    subcategoryName: c.subcategoryName,
                },
            },
            update: {},
            create: c,
        });
    }

    console.log(`Seeded ${data.length} categories.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
