// prisma/seedTransactionsAndPeriods.ts
import { PrismaClient, User } from '@prisma/client';
import { subDays, subMonths, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

interface PopulatedUser extends User {
    occupation: { name: string } | null;
}

// Helper to get a random element from an array
function getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

// More realistic amount generation based on category type
function generateRealisticAmount(subcategoryName: string, accountTypeName: string): number {
    let base = 10000;
    let range = 490000;

    if (accountTypeName === "Pemasukan") {
        if (subcategoryName.toLowerCase().includes("gaji")) { base = 3000000; range = 7000000 }
        else if (subcategoryName.toLowerCase().includes("bonus")) { base = 500000; range = 2000000; }
        else { base = 50000; range = 1000000; }
    } else if (accountTypeName === "Pengeluaran") {
        if (subcategoryName.toLowerCase().includes("perumahan") || subcategoryName.toLowerCase().includes("cicilan")) { base = 500000; range = 2500000; }
        else if (subcategoryName.toLowerCase().includes("pendidikan")) { base = 200000; range = 1500000; }
        else if (subcategoryName.toLowerCase().includes("transportasi") || subcategoryName.toLowerCase().includes("bahan bakar")) { base = 50000; range = 500000; }
        else if (subcategoryName.toLowerCase().includes("makanan")) { base = 20000; range = 200000; }
        else { base = 10000; range = 300000; }
    } else if (accountTypeName === "Aset" || accountTypeName === "Liabilitas") { // For initial balances or large movements
        base = 1000000; range = 50000000;
    }

    const amount = base + Math.random() * range;
    return Math.round(amount / 500) * 500; // Round to nearest 500
}


function randomDateForDay(day: Date): Date {
    const dateStart = startOfDay(day);
    const randomMsInDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    return new Date(dateStart.getTime() + randomMsInDay);
}

async function main() {
    console.log(`Start seeding Periods and Transactions ...`);

    const users: PopulatedUser[] = await prisma.user.findMany({ include: { occupation: { select: { name: true } } } });
    if (users.length === 0) {
        console.error("No users found. Please run user seed first.");
        process.exit(1);
    }

    const allSubcategories = await prisma.subcategory.findMany({
        include: { category: { include: { accountType: true } } }
    });
    if (allSubcategories.length === 0) {
        console.error("No subcategories found. Please run category/subcategory seed first.");
        process.exit(1);
    }

    const incomeSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Pemasukan");
    const expenseSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Pengeluaran");

    const endDate = new Date(); // Today
    const startDate = subMonths(endDate, 3); // Seed data for the last 3 months
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (const user of users) {
        console.log(`Seeding for user: ${user.name} (${user.email})`);

        // Create a general period for the user (could be evaluation or budgeting period)
        const periodDescription = `Periode data 3 bulan untuk ${user.name}`;
        const seededPeriod = await prisma.period.upsert({
            where: {
                uniq_user_period_dates_type: {
                    userId: user.id,
                    startDate: startDate,
                    endDate: endDate,
                    periodType: "general_evaluation" // A generic type for this seeded data
                }
            },
            update: { description: periodDescription },
            create: {
                userId: user.id,
                startDate: startDate,
                endDate: endDate,
                periodType: "general_evaluation",
                description: periodDescription,
            },
        });
        console.log(`  Upserted period ID ${seededPeriod.id} for user ${user.id}`);

        const transactionsToCreate = [];
        // Generate transactions for each day in the range
        for (let d = 0; d < totalDays; d++) {
            const currentDate = subDays(endDate, d);

            // Generate 1-3 income transactions per week
            if (currentDate.getDay() === 1 || currentDate.getDay() === 5) { // e.g., Monday or Friday
                for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) { // 1 to 2 income tx
                    const randomIncomeSubcat = getRandomElement(incomeSubcategories);
                    if (randomIncomeSubcat) {
                        transactionsToCreate.push({
                            userId: user.id,
                            subcategoryId: randomIncomeSubcat.id,
                            description: `Pemasukan ${randomIncomeSubcat.name} hari ${d + 1}`,
                            date: randomDateForDay(currentDate),
                            amount: generateRealisticAmount(randomIncomeSubcat.name, "Pemasukan"),
                            isBookmarked: Math.random() < 0.05, // 5% chance of being bookmarked
                        });
                    }
                }
            }

            // Generate 3-7 expense transactions per day
            const numExpensesToday = Math.floor(Math.random() * 5) + 3;
            for (let i = 0; i < numExpensesToday; i++) {
                const randomExpenseSubcat = getRandomElement(expenseSubcategories);
                if (randomExpenseSubcat) {
                    transactionsToCreate.push({
                        userId: user.id,
                        subcategoryId: randomExpenseSubcat.id,
                        description: `Pengeluaran ${randomExpenseSubcat.name} hari ${d + 1}, item ${i + 1}`,
                        date: randomDateForDay(currentDate),
                        amount: generateRealisticAmount(randomExpenseSubcat.name, "Pengeluaran"),
                        isBookmarked: Math.random() < 0.05,
                    });
                }
            }
        }

        if (transactionsToCreate.length > 0) {
            // Prisma's createMany doesn't support relation checks for some DBs,
            // but for PostgreSQL it should be fine. If issues, seed one by one.
            await prisma.transaction.createMany({
                data: transactionsToCreate,
            });
            console.log(`  Created ${transactionsToCreate.length} transactions for user ${user.id}`);
        }
    }

    console.log(`Seeding Periods and Transactions finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });