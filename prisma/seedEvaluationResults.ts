// prisma/seedEvaluationResults.ts
import { PrismaClient, Ratio, RatioComponent, Subcategory, Side, User } from "@prisma/client"; // Added User
import { startOfDay, endOfDay, subMonths, addMonths } from 'date-fns';

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

function calculateRatioValue(
    transactions: TransactionData[],
    ratio: PopulatedRatio
): number {
    // ... (this function remains the same as your provided one)
    let numeratorSum = 0;
    let denominatorSum = 0;

    for (const component of ratio.ratioComponents) {
        const relevantTransactions = transactions.filter(t => t.subcategoryId === component.subcategoryId);
        let componentSubtotal = 0;
        for (const tx of relevantTransactions) {
            componentSubtotal += tx.amount;
        }

        if (component.side === Side.numerator) {
            numeratorSum += componentSubtotal * component.sign;
        } else if (component.side === Side.denominator) {
            denominatorSum += componentSubtotal * component.sign;
        }
    }
    if (denominatorSum === 0) {
        if (ratio.code === "LIQUIDITY_RATIO" && numeratorSum === 0) return 0;
        if (ratio.code === "LIQUIDITY_RATIO" && numeratorSum > 0) return Infinity;
        return 0.0; // Default or NaN based on how you want to handle it
    }
    const rawValue = numeratorSum / denominatorSum;
    return rawValue * (ratio.multiplier || 1);
}


async function main() {
    console.log(`Start seeding EvaluationResults ...`);

    const users: User[] = await prisma.user.findMany(); // Just need user IDs
    if (!users.length) {
        console.log("No users found. Skipping EvaluationResult seeding.");
        return;
    }

    const ratios: PopulatedRatio[] = await prisma.ratio.findMany({
        include: {
            ratioComponents: {
                include: { subcategory: true },
            },
        },
    });
    if (!ratios.length) {
        console.log("No ratios defined. Skipping EvaluationResult seeding.");
        return;
    }

    const today = new Date();

    for (const user of users) {
        console.log(`  Processing user: ${user.name} (ID: ${user.id})`);

        // Create evaluations for the last 3 full months
        for (let m = 1; m <= 3; m++) {
            const currentMonthEvalStart = startOfDay(subMonths(today, m));
            const currentMonthEvalEnd = endOfDay(subMonths(startOfDay(addMonths(today, 1 - m)), 1)); // End of the m-th previous month

            console.log(`    Processing evaluation period: ${currentMonthEvalStart.toISOString().split('T')[0]} to ${currentMonthEvalEnd.toISOString().split('T')[0]}`);

            const transactionsInPeriod = await prisma.transaction.findMany({
                where: {
                    userId: user.id,
                    date: {
                        gte: currentMonthEvalStart,
                        lte: currentMonthEvalEnd,
                    },
                },
                select: { id: true, amount: true, subcategoryId: true, date: true },
            });

            if (!transactionsInPeriod.length) {
                console.log(`      No transactions found in this evaluation period for user ${user.name}.`);
                // Continue to next period or create INCOMPLETE results
                // For simplicity, we'll create INCOMPLETE if no transactions
            } else {
                console.log(`      Found ${transactionsInPeriod.length} transactions for calculation.`);
            }


            for (const ratio of ratios) {
                let calculatedValue = 0;
                let status: "IDEAL" | "NOT_IDEAL" | "INCOMPLETE" = "INCOMPLETE";

                if (transactionsInPeriod.length > 0) {
                    calculatedValue = calculateRatioValue(transactionsInPeriod, ratio);
                    if (isNaN(calculatedValue) || !isFinite(calculatedValue)) {
                        console.warn(`        Skipping EvaluationResult for Ratio "${ratio.title}" due to NaN/Infinity value.`);
                        calculatedValue = 0; // Store 0 for NaN/Infinity
                        status = 'INCOMPLETE';
                    } else {
                        // Determine status (simplified from your service, can be more complex)
                        let isIdeal = false;
                        if (ratio.lowerBound !== null && ratio.upperBound !== null) {
                            isIdeal = (ratio.isLowerBoundInclusive ? calculatedValue >= ratio.lowerBound : calculatedValue > ratio.lowerBound) &&
                                (ratio.isUpperBoundInclusive ? calculatedValue <= ratio.upperBound : calculatedValue < ratio.upperBound);
                        } else if (ratio.lowerBound !== null) {
                            isIdeal = ratio.isLowerBoundInclusive ? calculatedValue >= ratio.lowerBound : calculatedValue > ratio.lowerBound;
                        } else if (ratio.upperBound !== null) {
                            isIdeal = ratio.isUpperBoundInclusive ? calculatedValue <= ratio.upperBound : calculatedValue < ratio.upperBound;
                        }
                        status = isIdeal ? 'IDEAL' : 'NOT_IDEAL';
                    }
                }


                try {
                    const result = await prisma.evaluationResult.upsert({
                        where: {
                            uniq_user_eval_result_dates: { // Ensure this matches your Prisma schema unique constraint
                                userId: user.id,
                                ratioId: ratio.id,
                                startDate: currentMonthEvalStart,
                                endDate: currentMonthEvalEnd,
                            },
                        },
                        update: {
                            value: calculatedValue,
                            status: status,
                            calculatedAt: new Date(),
                        },
                        create: {
                            userId: user.id,
                            startDate: currentMonthEvalStart,
                            endDate: currentMonthEvalEnd,
                            ratioId: ratio.id,
                            value: calculatedValue,
                            status: status, // Set based on calculation or default to INCOMPLETE
                            calculatedAt: new Date(),
                        },
                    });
                    console.log(`        Upserted EvaluationResult for Ratio "${ratio.title}": Value = ${result.value.toFixed(2)}, Status: ${result.status}`);
                } catch (error) {
                    console.error(`        Failed to upsert EvaluationResult for Ratio "${ratio.title}", Period "${currentMonthEvalStart}-${currentMonthEvalEnd}":`, error);
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