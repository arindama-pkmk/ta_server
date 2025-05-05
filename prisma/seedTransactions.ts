import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, addMilliseconds, format } from 'date-fns';
import { loadEnvironmentVariable } from '../src/utils/environmentVariableHandler';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const saltRounds = Number(loadEnvironmentVariable('SALT_ROUNDS'));
    // 1) Upsert 10 test users
    const userData = [
        { name: 'Muchamad Diaz Adhari', username: 'muchamad_diaz', email: 'diaz.adhariseed@example.com', address: 'Kota Bandung', birthdate: new Date('2003-02-23'), password: 'changeme', occupation: 'Karyawan Muda' },
        { name: 'Bilsen Natan Sius', username: 'bilsen_sius', email: 'bilsen.sius@example.com', address: 'Kota Cimahi', birthdate: new Date('2007-01-22'), password: 'changeme', occupation: 'Pelajar' },
        { name: 'Aura', username: 'aura_seed', email: 'aura.seed@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2007-06-02'), password: 'changeme', occupation: 'Pelajar' },
        { name: 'Ikhsan Muhammad Fajar', username: 'ikhsan_fajar', email: 'ikhsan.fajar@example.com', address: 'Kabupaten Sumedang', birthdate: new Date('2003-09-19'), password: 'changeme', occupation: 'Mahasiswa' },
        { name: 'Fariz', username: 'fariz_seed', email: 'fariz.seed@example.com', address: 'Kabupaten Bandung Barat', birthdate: new Date('2003-02-12'), password: 'changeme', occupation: 'Karyawan Muda' },
        { name: 'Wulan Agustina', username: 'wulan_agustina', email: 'wulan.agustina@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2007-08-17'), password: 'changeme', occupation: 'Pelajar' },
        { name: 'Reni Apriani', username: 'reni_apriani', email: 'reni.apriani@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2004-04-28'), password: 'changeme', occupation: 'Mahasiswa' },
        { name: 'Rindi Afriani', username: 'rindi_afriani', email: 'rindi.afriani@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2004-08-29'), password: 'changeme', occupation: 'Mahasiswa' },
        { name: 'Reqi Jumantara', username: 'reqi_jumantara', email: 'reqi.jumantara@example.com', address: 'Bandung', birthdate: new Date('2025-04-23'), password: 'changeme', occupation: 'Mahasiswa' },
        { name: 'Azmy Ayu Ishfahani', username: 'azmy_ayu', email: 'azmy.ayu@example.com', address: 'Kota Bandung', birthdate: new Date('1997-02-17'), password: 'changeme', occupation: 'Mahasiswa' },
        { name: 'Agam Andika', username: 'agam_andika', email: 'agam.andika@example.com', address: 'Bandung', birthdate: new Date('1997-02-17'), password: 'changeme', occupation: 'Mahasiswa' },

    ];

    const users = [];
    for (const u of userData) {
        // Hash the plain-text password before seeding
        const hashedPassword = await bcrypt.hash(u.password, saltRounds);
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                ...u,
                password: hashedPassword,
            },
        });
        users.push(user);
    }


    // 2) Load all categories (must be pre-seeded)
    const categories = await prisma.category.findMany();
    if (categories.length === 0) {
        console.error('No categories found—run your category seed first.');
        process.exit(1);
    }

    // 3) Group subcategories by categoryId
    type CatInfo = { accountType: string; subcats: string[] };
    const byCat: Record<string, CatInfo> = {};
    for (const c of categories) {
        byCat[c.id] ??= { accountType: c.accountType, subcats: [] };
        byCat[c.id]?.subcats.push(c.subcategoryName);
    }

    const today = new Date();
    const startDate = subMonths(today, 2); // two months back

    // 4) For each day in the last 2 months
    const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const day = subDays(today, dayOffset);

        // 5) For each user, each category/subcategory, create 2 transactions
        for (const user of users) {
            for (const [categoryId, info] of Object.entries(byCat)) {
                for (const sub of info.subcats) {
                    for (let i = 0; i < 2; i++) {
                        const minuteOfDay = Math.floor(Math.random() * 24 * 60);
                        const txDate = addMilliseconds(
                            new Date(day.setHours(0, 0, 0, 0)),
                            minuteOfDay * 60 * 1000 + Math.floor(Math.random() * 60000)
                        );
                        const amount = Math.round((10_000 + Math.random() * 490_000) / 500) * 500;

                        await prisma.transaction.create({
                            data: {
                                userId: user.id,
                                description: `${sub} transaction`,
                                amount,
                                date: txDate,
                                categoryId,
                                isBookmarked: false,
                            },
                        });
                    }
                }
            }
        }

        if (dayOffset % 1 === 0) {
            console.log(`Seeded day ${dayOffset}: ${format(day, 'yyyy-MM-dd')}`);
        }
    }

    console.log('✅ Done seeding users and transactions!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
