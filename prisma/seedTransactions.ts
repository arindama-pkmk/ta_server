// prisma/seedTransactions.ts
import { PrismaClient } from '@prisma/client';
import { subDays, addMilliseconds, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    // 1) Upsert a test user
    const user = await prisma.user.upsert({
        where: { email: 'seed.user@example.com' },
        update: {},
        create: {
            name: 'Seed User',
            username: 'seeduser',
            email: 'seed.user@example.com',
            phone: '081234567890',
            password: 'changeme', // In production, hash this!
            occupation: 'Seeder',
        },
    });

    // 2) Load all categories (must be pre-seeded)
    const categories = await prisma.category.findMany();
    if (categories.length === 0) {
        console.error('No categories found—run your category seed first.');
        process.exit(1);
    }

    // 3) Group subcategories by categoryId and capture accountType
    type CatInfo = { accountType: string; subcats: string[] };
    const byCat: Record<string, CatInfo> = {};
    for (const c of categories) {
        if (!byCat[c.id]) {
            byCat[c.id] = { accountType: c.accountType, subcats: [] };
        }
        byCat[c.id]?.subcats.push(c.subcategoryName);
    }

    const today = new Date();

    // 4) For each of the last 365 days...
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
        const day = subDays(today, dayOffset);

        // 5) For each category/subcategory, insert 5 transactions
        for (const [categoryId, info] of Object.entries(byCat)) {
            for (const sub of info.subcats) {
                for (let i = 0; i < 5; i++) {
                    // pick a random minute of the day + a few random milliseconds
                    const minuteOfDay = Math.floor(Math.random() * 24 * 60);
                    const txDate = addMilliseconds(
                        new Date(day.setHours(0, 0, 0, 0)),
                        minuteOfDay * 60 * 1000 + Math.floor(Math.random() * 60000)
                    );

                    // random amount between 10,000 and 500,000 in multiples of 500
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

        // Log progress every 30 days
        if (dayOffset % 30 === 0) {
            console.log(
                `Seeded day ${dayOffset}: ${format(
                    subDays(today, dayOffset),
                    'yyyy-MM-dd'
                )}`
            );
        }
    }

    console.log('✅ Done seeding transactions!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
