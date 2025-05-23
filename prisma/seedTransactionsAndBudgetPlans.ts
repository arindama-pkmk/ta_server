// prisma/seedTransactionsAndBudgetPlans.ts
import { PrismaClient, User, Subcategory, Category, AccountType, Prisma } from '@prisma/client';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns'; // Added endOfDay
import { Decimal } from '@prisma/client/runtime/library'; // For Prisma Decimal type

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

function generateRealisticAmount(subcategoryName: string, accountTypeName: string): number {
    // ... (this function remains the same)
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
    } else if (accountTypeName === "Aset" || accountTypeName === "Liabilitas") {
        base = 1000000; range = 50000000;
    }
    const amount = base + Math.random() * range;
    return Math.round(amount / 500) * 500;
}

function randomDateForDay(day: Date): Date {
    const dateStart = startOfDay(day);
    const randomMsInDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    return new Date(dateStart.getTime() + randomMsInDay);
}

async function main() {
    console.log(`Start seeding BudgetPlans, Transactions, and ExpenseAllocations ...`);

    const users: PopulatedUser[] = await prisma.user.findMany({ include: { occupation: { select: { name: true } } } });
    if (users.length === 0) {
        console.error("No users found. Please run user seed first.");
        process.exit(1);
    }

    const allSubcategories: PopulatedSubcategory[] = await prisma.subcategory.findMany({
        include: { category: { include: { accountType: true } } }
    });
    if (allSubcategories.length === 0) {
        console.error("No subcategories found. Please run category/subcategory seed first.");
        process.exit(1);
    }

    const incomeSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Pemasukan");
    const expenseSubcategories = allSubcategories.filter(sc => sc.category.accountType.name === "Pengeluaran");

    const planEndDate = endOfDay(new Date()); // Use end of today for the plan
    const planStartDate = startOfDay(subMonths(planEndDate, 3)); // Plan for the last 3 months

    for (const user of users) {
        console.log(`Seeding for user: ${user.name} (${user.email})`);

        // --- Create Transactions ---
        const transactionsToCreate: Prisma.TransactionCreateManyInput[] = [];
        let totalCalculatedIncomeForPlan = 0;
        const totalDays = Math.ceil((planEndDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));

        for (let d = 0; d < totalDays; d++) {
            const currentDate = subDays(planEndDate, d); // Iterate backwards from planEndDate

            if (currentDate.getDay() === 1 || currentDate.getDay() === 5) {
                for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
                    const randomIncomeSubcat = getRandomElement(incomeSubcategories);
                    if (randomIncomeSubcat) {
                        const amount = generateRealisticAmount(randomIncomeSubcat.name, "Pemasukan");
                        transactionsToCreate.push({
                            userId: user.id,
                            subcategoryId: randomIncomeSubcat.id,
                            description: `Pemasukan ${randomIncomeSubcat.name} hari ${d + 1}`,
                            date: randomDateForDay(currentDate),
                            amount: amount,
                            isBookmarked: Math.random() < 0.05,
                        });
                        totalCalculatedIncomeForPlan += amount; // Sum up income for the budget plan
                    }
                }
            }

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
            await prisma.transaction.createMany({
                data: transactionsToCreate,
            });
            console.log(`  Created ${transactionsToCreate.length} transactions for user ${user.id}`);
        }

        // --- Create a BudgetPlan ---
        const budgetPlanDescription = `Anggaran 3 Bulan Terakhir (${user.name})`;
        const seededBudgetPlan = await prisma.budgetPlan.upsert({
            where: {
                uniq_user_budget_plan_dates_desc: { // Use the unique constraint
                    userId: user.id,
                    planStartDate: planStartDate,
                    planEndDate: planEndDate,
                    description: budgetPlanDescription,
                }
            },
            update: { totalCalculatedIncome: new Decimal(totalCalculatedIncomeForPlan.toString()) },
            create: {
                userId: user.id,
                description: budgetPlanDescription,
                planStartDate: planStartDate,
                planEndDate: planEndDate,
                incomeCalculationStartDate: planStartDate, // For this seed, income calc period is same as plan period
                incomeCalculationEndDate: planEndDate,
                totalCalculatedIncome: new Decimal(totalCalculatedIncomeForPlan.toString()),
            },
        });
        console.log(`  Upserted BudgetPlan ID ${seededBudgetPlan.id} with total income ${totalCalculatedIncomeForPlan}`);

        // --- Create some ExpenseAllocations for this BudgetPlan ---
        const allocationsToCreate: Prisma.ExpenseAllocationCreateManyInput[] = [];
        const numAllocationsToCreate = Math.min(expenseSubcategories.length, Math.floor(Math.random() * 4) + 2); // 2-5 allocations
        let remainingPercentage = 100;

        for (let i = 0; i < numAllocationsToCreate; i++) {
            const randomExpenseSubcat = getRandomElement(expenseSubcategories.filter(
                // Ensure we don't pick the same subcategory twice for allocations for simplicity
                esc => !allocationsToCreate.find(a => a.subcategoryId === esc.id)
            ));
            if (randomExpenseSubcat) {
                let percentage = 0;
                if (i === numAllocationsToCreate - 1) { // Last allocation takes remaining percentage
                    percentage = remainingPercentage;
                } else {
                    percentage = Math.floor(Math.random() * (remainingPercentage / 2)) + 10; // 10% to half of remaining
                    percentage = Math.min(percentage, remainingPercentage); // Ensure not over
                }
                remainingPercentage -= percentage;
                percentage = Math.max(0, percentage); // Ensure not negative

                if (percentage > 0) {
                    allocationsToCreate.push({
                        budgetPlanId: seededBudgetPlan.id,
                        categoryId: randomExpenseSubcat.categoryId,
                        subcategoryId: randomExpenseSubcat.id,
                        percentage: new Decimal(percentage.toString()),
                        amount: new Decimal(((percentage / 100) * totalCalculatedIncomeForPlan).toString()),
                    });
                }
            }
            if (remainingPercentage <= 0 && i < numAllocationsToCreate - 1) break; // Stop if no percentage left
        }
        if (allocationsToCreate.length > 0) {
            await prisma.expenseAllocation.createMany({
                data: allocationsToCreate,
            });
            console.log(`    Created ${allocationsToCreate.length} expense allocations for BudgetPlan ${seededBudgetPlan.id}`);
        }
    }

    console.log(`Seeding BudgetPlans, Transactions, and Allocations finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });