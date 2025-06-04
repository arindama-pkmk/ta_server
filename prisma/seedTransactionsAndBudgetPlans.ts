// prisma/seedTransactionsAndBudgetPlans.ts
import { PrismaClient, User, Subcategory, Category, AccountType, Prisma } from '@prisma/client';
import { subDays, subMonths, startOfDay, addDays, startOfMonth, endOfMonth as dateFnsEndOfMonth } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface PopulatedUser extends User {
    occupation: { name: string } | null;
}

interface PopulatedSubcategory extends Subcategory {
    category: Category & { accountType: AccountType };
}

function getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRealisticAmount(subcategoryName: string, accountTypeName: string, userOccupationName?: string): number {
    let base = 10000;
    let range = 490000;
    let occupationMultiplier = 1.0;

    if (userOccupationName === "Pekerja") {
        occupationMultiplier = 1.8 + Math.random() * 1.2;
    } else if (userOccupationName === "Suami/Istri") {
        occupationMultiplier = 1.5 + Math.random() * 1.0;
    } else {
        occupationMultiplier = 0.4 + Math.random() * 0.5;
    }

    if (accountTypeName === "Pemasukan") {
        if (subcategoryName.toLowerCase().includes("gaji")) { base = 7000000; range = 12000000; }
        else if (subcategoryName.toLowerCase().includes("bonus") || subcategoryName.toLowerCase().includes("commission")) { base = 1500000; range = 6000000; }
        else if (subcategoryName.toLowerCase().includes("dividen") || subcategoryName.toLowerCase().includes("bunga")) { base = 75000; range = 700000; }
        else { base = 300000; range = 3000000; }
        base *= occupationMultiplier;
        range *= occupationMultiplier;
    } else if (accountTypeName === "Pengeluaran") {
        const incomeEquivalentForExpenseBase = (7000000 * occupationMultiplier);
        const expenseRatioToIncome = 0.4 + Math.random() * 0.3;

        if (subcategoryName.toLowerCase().includes("perumahan") || subcategoryName.toLowerCase().includes("bayar pinjaman")) { base = 0.15 * incomeEquivalentForExpenseBase; range = 0.1 * incomeEquivalentForExpenseBase; }
        else if (subcategoryName.toLowerCase().includes("pendidikan")) { base = 0.05 * incomeEquivalentForExpenseBase; range = 0.1 * incomeEquivalentForExpenseBase; }
        else if (subcategoryName.toLowerCase().includes("transportasi") || subcategoryName.toLowerCase().includes("bahan bakar")) { base = 0.05 * incomeEquivalentForExpenseBase; range = 0.05 * incomeEquivalentForExpenseBase; }
        else if (subcategoryName.toLowerCase().includes("makanan")) { base = 0.1 * incomeEquivalentForExpenseBase; range = 0.05 * incomeEquivalentForExpenseBase; }
        else if (subcategoryName.toLowerCase().includes("kesehatan") || subcategoryName.toLowerCase().includes("medis")) { base = 0.03 * incomeEquivalentForExpenseBase; range = 0.04 * incomeEquivalentForExpenseBase; }
        else if (subcategoryName.toLowerCase().includes("tabungan")) { base = 0.1 * incomeEquivalentForExpenseBase; range = 0.1 * incomeEquivalentForExpenseBase; }
        else { base = 0.02 * incomeEquivalentForExpenseBase; range = 0.03 * incomeEquivalentForExpenseBase; }
        base *= expenseRatioToIncome;
        range *= expenseRatioToIncome;

    } else if (accountTypeName === "Aset") {
        if (subcategoryName.toLowerCase().includes("uang tunai") || subcategoryName.toLowerCase().includes("uang rekening bank")) { base = 5000000 * occupationMultiplier; range = 20000000 * occupationMultiplier; }
        else if (subcategoryName.toLowerCase().includes("rumah") || subcategoryName.toLowerCase().includes("apartemen")) { base = 300000000 * occupationMultiplier; range = 700000000 * occupationMultiplier; }
        else if (subcategoryName.toLowerCase().includes("kendaraan")) { base = 50000000 * occupationMultiplier; range = 250000000 * occupationMultiplier; }
        else if (subcategoryName.toLowerCase().includes("saham") || subcategoryName.toLowerCase().includes("obligasi") || subcategoryName.toLowerCase().includes("reksadana") || subcategoryName.toLowerCase().includes("kripto")) { base = 10000000 * occupationMultiplier; range = 80000000 * occupationMultiplier; }
        else { base = 2000000 * occupationMultiplier; range = 30000000 * occupationMultiplier; }
    } else if (accountTypeName === "Liabilitas") {
        if (subcategoryName.toLowerCase().includes("pinjaman properti") || subcategoryName.toLowerCase().includes("kpr")) { base = 200000000 * occupationMultiplier * 0.7; range = 600000000 * occupationMultiplier * 0.7; }
        else if (subcategoryName.toLowerCase().includes("pinjaman") || subcategoryName.toLowerCase().includes("cicilan")) { base = 10000000 * occupationMultiplier * 0.5; range = 100000000 * occupationMultiplier * 0.5; }
        else if (subcategoryName.toLowerCase().includes("saldo kartu kredit")) { base = 500000 * occupationMultiplier; range = 15000000 * occupationMultiplier; }
        else { base = 200000 * occupationMultiplier; range = 8000000 * occupationMultiplier; }
    }
    const amount = base + Math.random() * range;
    return Math.max(10000, Math.round(amount / 5000) * 5000);
}

function randomDateForDay(day: Date): Date {
    const dateStart = startOfDay(day);
    const randomMsInDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    return new Date(dateStart.getTime() + randomMsInDay);
}

async function main() {
    console.log(`Start seeding BudgetPlans, Transactions, and ExpenseAllocations ...`);

    const users: PopulatedUser[] = await prisma.user.findMany({ include: { occupation: { select: { name: true } } } });
    if (users.length === 0) { console.error("No users found."); process.exit(1); }

    const allSubcategories: PopulatedSubcategory[] = await prisma.subcategory.findMany({
        include: { category: { include: { accountType: true } } }
    });
    if (allSubcategories.length === 0) { console.error("No subcategories found."); process.exit(1); }

    const incomeSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Pemasukan");
    const expenseSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Pengeluaran");
    const assetSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Aset");
    const liabilitySubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Liabilitas");

    if (incomeSubcategories.length === 0) { console.warn("Warning: No 'Pemasukan' subcategories found."); }
    if (expenseSubcategories.length === 0) { console.warn("Warning: No 'Pengeluaran' subcategories found."); }
    if (assetSubcategories.length === 0) { console.warn("Warning: No 'Aset' subcategories found."); }
    if (liabilitySubcategories.length === 0) { console.warn("Warning: No 'Liabilitas' subcategories found."); }

    const today = new Date();
    const planEndMonth = subMonths(startOfMonth(today), 1);
    const planStartMonth = subMonths(planEndMonth, 2);
    const planStartDate = startOfMonth(planStartMonth);
    const planEndDate = dateFnsEndOfMonth(planEndMonth);

    const transactionSeedEndDate = addDays(today, 7);
    const transactionSeedStartDate = startOfDay(subMonths(today, 6));

    const overallSeedingStats: Record<string, {
        accountTypes: Record<string, number>,
        categories: Record<string, number>,
        subcategories: Record<string, number>
    }> = {};

    for (const user of users) {
        console.log(`\nSeeding for user: ${user.name} (${user.email}, Occupation: ${user.occupation?.name ?? 'N/A'})`);
        const userOccupationName = user.occupation?.name;
        const transactionsToCreate: Prisma.TransactionCreateManyInput[] = [];

        const userStats = {
            accountTypes: {} as Record<string, number>,
            categories: {} as Record<string, number>,
            subcategories: {} as Record<string, number>
        };

        const addTxAndLog = (subcat: PopulatedSubcategory, description: string, date: Date, amount: number, isBookmarked: boolean) => {
            transactionsToCreate.push({
                userId: user.id, subcategoryId: subcat.id,
                description, date, amount, isBookmarked
            });
            const accTypeName = subcat.category.accountType.name;
            const catName = subcat.category.name;
            const subcatName = subcat.name;

            userStats.accountTypes[accTypeName] = (userStats.accountTypes[accTypeName] || 0) + 1;
            userStats.categories[`${accTypeName} > ${catName}`] = (userStats.categories[`${accTypeName} > ${catName}`] || 0) + 1;
            userStats.subcategories[`${accTypeName} > ${catName} > ${subcatName}`] = (userStats.subcategories[`${accTypeName} > ${catName} > ${subcatName}`] || 0) + 1;
        };

        const openingBalanceDate = subDays(transactionSeedStartDate, 10);

        const assetItemsToSeed = [
            { name: "Uang Rekening Bank", count: 1 }, { name: "Saham", count: Math.random() > 0.3 ? 1 : 0 },
            { name: "Rumah", count: (userOccupationName !== "Pelajar/Mahasiswa" && Math.random() > 0.2) ? 1 : 0 },
            { name: "Kendaraan", count: (userOccupationName !== "Pelajar/Mahasiswa" && Math.random() > 0.3) ? 1 : 0 },
            { name: "Kripto", count: Math.random() > 0.5 ? 1 : 0 }
        ];
        for (const item of assetItemsToSeed) {
            if (item.count === 0) continue;
            const subcat = assetSubcategories.find(s => s.name === item.name);
            if (subcat) {
                addTxAndLog(subcat, `Saldo awal ${subcat.name}`, openingBalanceDate, generateRealisticAmount(subcat.name, "Aset", userOccupationName), false);
            }
        }

        const liabilityItemsToSeed = [
            { name: "Pinjaman Properti", count: assetItemsToSeed.find(i => i.name === "Rumah")?.count === 1 && Math.random() > 0.2 ? 1 : 0 },
            { name: "Cicilan", count: assetItemsToSeed.find(i => i.name === "Kendaraan")?.count === 1 && Math.random() > 0.2 ? 1 : 0 },
            { name: "Saldo Kartu Kredit", count: (userOccupationName !== "Pelajar/Mahasiswa" && Math.random() > 0.2) ? 1 : 0 }
        ];
        for (const item of liabilityItemsToSeed) {
            if (item.count === 0) continue;
            const subcat = liabilitySubcategories.find(s => s.name === item.name);
            if (subcat) {
                addTxAndLog(subcat, `Utang awal ${subcat.name}`, openingBalanceDate, generateRealisticAmount(subcat.name, "Liabilitas", userOccupationName), false);
            }
        }

        let totalCalculatedIncomeForBudgetPlanPeriod = 0;
        const totalDaysToSeedTransactions = Math.ceil((transactionSeedEndDate.getTime() - transactionSeedStartDate.getTime()) / (1000 * 60 * 60 * 24));

        for (let d = 0; d < totalDaysToSeedTransactions; d++) {
            const currentDate = addDays(transactionSeedStartDate, d);
            if (currentDate.getDate() === 1 || currentDate.getDate() === 25) {
                const gajiSubcat = incomeSubcategories.find(s => s.name.toLowerCase().includes("gaji"));
                if (gajiSubcat) {
                    const amount = generateRealisticAmount(gajiSubcat.name, "Pemasukan", userOccupationName);
                    addTxAndLog(gajiSubcat, `Gaji ${gajiSubcat.name}`, randomDateForDay(currentDate), amount, Math.random() < 0.01);
                    if (currentDate >= planStartDate && currentDate <= planEndDate) {
                        totalCalculatedIncomeForBudgetPlanPeriod += amount;
                    }
                }
            }
            if (Math.random() < 0.08) {
                const randomIncomeSubcat = getRandomElement(incomeSubcategories.filter(s => !s.name.toLowerCase().includes("gaji")));
                if (randomIncomeSubcat) {
                    const amount = generateRealisticAmount(randomIncomeSubcat.name, "Pemasukan", userOccupationName);
                    addTxAndLog(randomIncomeSubcat, `Pendapatan ${randomIncomeSubcat.name}`, randomDateForDay(currentDate), amount, Math.random() < 0.05);
                    if (currentDate >= planStartDate && currentDate <= planEndDate) {
                        totalCalculatedIncomeForBudgetPlanPeriod += amount;
                    }
                }
            }
            const numExpensesToday = Math.floor(Math.random() * (userOccupationName === "Pelajar/Mahasiswa" ? 4 : 6)) + 1;
            for (let i = 0; i < numExpensesToday; i++) {
                const randomExpenseSubcat = getRandomElement(expenseSubcategories);
                if (randomExpenseSubcat) {
                    addTxAndLog(randomExpenseSubcat, `Belanja ${randomExpenseSubcat.name}`, randomDateForDay(currentDate), generateRealisticAmount(randomExpenseSubcat.name, "Pengeluaran", userOccupationName), Math.random() < 0.05);
                }
            }
        }

        if (transactionsToCreate.length > 0) {
            await prisma.transaction.createMany({ data: transactionsToCreate, skipDuplicates: true });
            console.log(`  Created ${transactionsToCreate.length} transactions for user ${user.id}`);
        }
        overallSeedingStats[user.id] = userStats;

        const seededBudgetPlan = await prisma.budgetPlan.upsert({
            where: { uniq_user_budget_plan_dates: { userId: user.id, planStartDate, planEndDate } },
            update: { totalCalculatedIncome: new Decimal(totalCalculatedIncomeForBudgetPlanPeriod.toFixed(2)) },
            create: {
                userId: user.id, planStartDate, planEndDate,
                incomeCalculationStartDate: planStartDate, incomeCalculationEndDate: planEndDate,
                totalCalculatedIncome: new Decimal(totalCalculatedIncomeForBudgetPlanPeriod.toFixed(2)),
            },
        });
        console.log(`  Upserted BudgetPlan ID ${seededBudgetPlan.id} with total income ${totalCalculatedIncomeForBudgetPlanPeriod.toFixed(2)}`);

        if (totalCalculatedIncomeForBudgetPlanPeriod > 100000) {
            const allocationsToCreate: Prisma.ExpenseAllocationCreateManyInput[] = [];
            const numAllocations = Math.min(expenseSubcategories.length, Math.floor(Math.random() * 3) + 3);
            let remainingPercentage = new Decimal(100);
            const usedSubcatIds = new Set<string>();

            for (let i = 0; i < numAllocations; i++) {
                const availableSubcats = expenseSubcategories.filter(sc => !usedSubcatIds.has(sc.id));
                if (availableSubcats.length === 0) break;
                const subcat = getRandomElement(availableSubcats)!;
                usedSubcatIds.add(subcat.id);

                let percentage: Decimal;
                if (i === numAllocations - 1 || remainingPercentage.isZero() || remainingPercentage.isNegative()) {
                    percentage = remainingPercentage.clamp(0, 100);
                } else {
                    const randomChunk = new Decimal(Math.random() * 0.3 + 0.1);
                    percentage = remainingPercentage.mul(randomChunk).toDecimalPlaces(2);
                    if (remainingPercentage.sub(percentage).isNegative() && i < numAllocations - 1) {
                        percentage = remainingPercentage.sub(new Decimal((numAllocations - 1 - i) * 5)).clamp(5, 100)
                    }
                    percentage = percentage.clamp(5, 70);
                }

                if (percentage.isPositive()) {
                    allocationsToCreate.push({
                        budgetPlanId: seededBudgetPlan.id, categoryId: subcat.categoryId, subcategoryId: subcat.id,
                        percentage: percentage,
                        amount: new Decimal(percentage.toNumber() / 100 * totalCalculatedIncomeForBudgetPlanPeriod).toDecimalPlaces(2),
                    });
                    remainingPercentage = remainingPercentage.sub(percentage);
                }
                if (remainingPercentage.isZero() || remainingPercentage.isNegative()) break;
            }
            if (allocationsToCreate.length > 0) {
                const currentTotalPercentage = allocationsToCreate.reduce((sum, alloc) => sum.add(alloc.percentage as Decimal), new Decimal(0));
                if (!currentTotalPercentage.equals(100) && allocationsToCreate.length > 0 && remainingPercentage.isPositive()) {
                    const lastAlloc = allocationsToCreate[allocationsToCreate.length - 1];
                    if (lastAlloc) {
                        const newLastPercentage = (lastAlloc.percentage as Decimal).add(remainingPercentage);
                        if (newLastPercentage.isPositive()) {
                            lastAlloc.percentage = newLastPercentage.toDecimalPlaces(2);
                            lastAlloc.amount = new Decimal(newLastPercentage.toNumber() / 100 * totalCalculatedIncomeForBudgetPlanPeriod).toDecimalPlaces(2);
                        }
                    }
                }
                await prisma.expenseAllocation.createMany({ data: allocationsToCreate, skipDuplicates: true });
                console.log(`    Created ${allocationsToCreate.length} expense allocations for BudgetPlan ${seededBudgetPlan.id}`);
            }
        } else {
            console.log(`    Skipping expense allocations for BudgetPlan ${seededBudgetPlan.id} due to low/zero income.`);
        }
    }

    console.log("\n--- Overall Transaction Seeding Statistics ---");
    for (const userIdKey in overallSeedingStats) {
        // Check if the property actually exists on the object to satisfy TypeScript
        if (Object.prototype.hasOwnProperty.call(overallSeedingStats, userIdKey)) {
            const userStatsForLog = overallSeedingStats[userIdKey]; // Now TypeScript knows this is defined
            const user = users.find(u => u.id === userIdKey);
            console.log(`\nUser: ${user?.name} (${user?.email})`);

            if (userStatsForLog) {
                if (userStatsForLog.accountTypes) { // Check if accountTypes itself is defined
                    console.log("  Account Types:");
                    for (const accType in userStatsForLog.accountTypes) {
                        if (Object.prototype.hasOwnProperty.call(userStatsForLog.accountTypes, accType)) {
                            console.log(`    - ${accType}: ${userStatsForLog.accountTypes[accType]}`);
                        }
                    }
                }
                // Uncomment and use similar hasOwnProperty checks if you enable these logs
                if (userStatsForLog.categories) {
                    console.log("  Categories:");
                    for (const cat in userStatsForLog.categories) {
                        if (Object.prototype.hasOwnProperty.call(userStatsForLog.categories, cat)) {
                            console.log(`    - ${cat}: ${userStatsForLog.categories[cat]}`);
                        }
                    }
                }
                if (userStatsForLog.subcategories) {
                    console.log("  Subcategories:");
                    for (const subcat in userStatsForLog.subcategories) {
                        if (Object.prototype.hasOwnProperty.call(userStatsForLog.subcategories, subcat)) {
                            console.log(`    - ${subcat}: ${userStatsForLog.subcategories[subcat]}`);
                        }
                    }
                }
            }
        }
    }

    console.log(`\nSeeding BudgetPlans, Transactions, and Allocations finished.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });