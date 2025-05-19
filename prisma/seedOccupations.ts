// prisma/seedOccupations.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const occupationNames: string[] = [
    "Pelajar/Mahasiswa", // Combines Pelajar and Mahasiswa for simplicity
    "Pekerja",           // For Pekerja (Belum Menikah) and potentially others
    "Suami/Istri",       // For Suami-Istri (dengan anak < 18 tahun)
];

async function main() {
    console.log(`Start seeding occupations ...`);
    for (const name of occupationNames) {
        const occupation = await prisma.occupation.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        console.log(`Created or found occupation with id: ${occupation.id} (${occupation.name})`);
    }
    console.log(`Seeding occupations finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });