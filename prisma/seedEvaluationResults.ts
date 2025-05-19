// prisma/seedEvaluationResults.ts
import { PrismaClient, User, Period, Ratio, RatioComponent, Subcategory, Side, AggregationType, EvaluationResult } from "@prisma/client";
import { startOfDay, endOfDay } from 'date-fns'; // For precise date comparisons

const prisma = new PrismaClient();

interface TransactionData {
    id: string;
    amount: number;
    subcategoryId: string;
    date: Date;
}

interface PopulatedRatio extends Ratio {
    ratioComponents: (RatioComponent & { subcategory: Subcategory })[];
}

// This is a simplified version of your Flutter _TxSums and _computeSums
// Adapted for the seed environment.
class TxSums {
    sums: Record<string, number> = {}; // Store sums for different conceptual groups

    constructor(
        transactions: TransactionData[],
        ratioComponents: (RatioComponent & { subcategory: Subcategory })[]
    ) {
        const subcategoryMap = new Map<string, string>(); // subcategoryId -> subcategoryName
        ratioComponents.forEach(rc => {
            if (rc.subcategory) { // Ensure subcategory is populated
                subcategoryMap.set(rc.subcategory.id, rc.subcategory.name);
            }
        });

        // Initialize conceptual sums based on unique subcategories involved in ANY ratio
        // For simplicity, we'll directly sum for numerator/denominator components later.
        // This TxSums could be made more generic if many ratios shared intermediate sums like "Total Liquid Assets"
        // but for direct calculation per ratio, it's simpler to process components directly.
    }
}

function calculateRatioValue(
    transactions: TransactionData[],
    ratio: PopulatedRatio
): number {
    let numeratorSum = 0;
    let denominatorSum = 0;

    for (const component of ratio.ratioComponents) {
        const relevantTransactions = transactions.filter(t => t.subcategoryId === component.subcategoryId);
        let componentSubtotal = 0;
        for (const tx of relevantTransactions) {
            componentSubtotal += tx.amount; // Assuming SUM aggregation for all for now
        }

        if (component.side === Side.numerator) {
            numeratorSum += componentSubtotal * component.sign;
        } else if (component.side === Side.denominator) {
            denominatorSum += componentSubtotal * component.sign;
        }
    }

    if (denominatorSum === 0) {
        // Handle division by zero - specific ratios might have different fallbacks
        // For example, if income is 0 for Savings Ratio, result is 0.
        // If total assets is 0 for Debt-to-Asset, might be 0 or Infinity.
        // We'll return 0 for simplicity in seeding, or NaN if that's preferred for "incomplete".
        if (ratio.code === "LIQUIDITY_RATIO" && numeratorSum === 0) return 0; // If no expenses and no liquid assets
        if (ratio.code === "LIQUIDITY_RATIO" && numeratorSum > 0) return Infinity; // Positive liquid assets but zero expenses
        // Add more specific handling per ratio if needed based on your app's logic for zero denominators
        return 0.0;
    }

    const rawValue = numeratorSum / denominatorSum;
    return rawValue * (ratio.multiplier || 1); // Apply multiplier
}


async function main() {
    console.log(`Start seeding EvaluationResults ...`);

    const users = await prisma.user.findMany();
    if (!users.length) {
        console.log("No users found. Skipping EvaluationResult seeding.");
        return;
    }

    const ratios: PopulatedRatio[] = await prisma.ratio.findMany({
        include: {
            ratioComponents: {
                include: {
                    subcategory: true, // We need subcategory names/IDs for filtering transactions
                },
            },
        },
    });
    if (!ratios.length) {
        console.log("No ratios defined. Skipping EvaluationResult seeding.");
        return;
    }

    for (const user of users) {
        console.log(`  Processing user: ${user.name} (ID: ${user.id})`);
        const userPeriods = await prisma.period.findMany({
            where: {
                userId: user.id,
                // periodType: "general_evaluation" // Or fetch all types if you want to calc for all
            },
        });

        if (!userPeriods.length) {
            console.log(`    No periods found for user ${user.name}. Skipping.`);
            continue;
        }

        for (const period of userPeriods) {
            console.log(`    Processing period: ${period.id} (Type: ${period.periodType}, ${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]})`);

            const transactionsInPeriod = await prisma.transaction.findMany({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfDay(period.startDate), // Ensure comparison is from start of day
                        lte: endOfDay(period.endDate),     // Ensure comparison is to end of day
                    },
                },
                select: { id: true, amount: true, subcategoryId: true, date: true }, // Select only needed fields
            });

            if (!transactionsInPeriod.length) {
                console.log(`      No transactions found in this period for user ${user.name}.`);
                // Optionally create "INCOMPLETE" results or skip
            }

            console.log(`      Found ${transactionsInPeriod.length} transactions for calculation.`);

            for (const ratio of ratios) {
                const calculatedValue = calculateRatioValue(transactionsInPeriod, ratio);

                console.log(`        Ratio: ${ratio.title}, Raw Calculated Value: ${calculatedValue / (ratio.multiplier || 1)}, Final Value: ${calculatedValue}`);

                if (isNaN(calculatedValue) || !isFinite(calculatedValue)) {
                    console.warn(`        Skipping EvaluationResult for Ratio "${ratio.title}" due to NaN/Infinity value. Period ID: ${period.id}`);
                    // Optionally, you could store it with a specific status or a conventional value.
                    // For now, we skip to avoid DB errors with non-finite floats.
                    continue;
                }


                try {
                    const result = await prisma.evaluationResult.upsert({
                        where: {
                            uniq_result_ratio_period: {
                                ratioId: ratio.id,
                                periodId: period.id,
                            },
                        },
                        update: {
                            value: calculatedValue,
                            calculatedAt: new Date(), // Update calculation time
                        },
                        create: {
                            ratioId: ratio.id,
                            periodId: period.id,
                            value: calculatedValue,
                            calculatedAt: new Date(),
                            status: 'INCOMPLETE', // or any other valid status
                            userId: user.id, // assuming you have the user ID available
                        },
                    });
                    console.log(`        Upserted EvaluationResult for Ratio "${ratio.title}": Value = ${result.value.toFixed(2)}`);
                } catch (error) {
                    console.error(`        Failed to upsert EvaluationResult for Ratio "${ratio.title}", Period "${period.id}":`, error);
                }
            }
        }
    }

    console.log(`Seeding EvaluationResults finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });