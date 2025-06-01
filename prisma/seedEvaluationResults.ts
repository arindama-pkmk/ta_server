// prisma/seedEvaluationResults.ts
import { PrismaClient, Ratio, RatioComponent, Subcategory, Category, AccountType, Side, AggregationType, User, EvaluationStatus } from "@prisma/client"; // Added Category, AccountType
import { startOfMonth, endOfMonth as dateFnsEndOfMonth, subMonths } from 'date-fns'; // Corrected imports

const prisma = new PrismaClient();

interface TransactionData {
    id: string;
    amount: number;
    subcategoryId: string;
    date: Date;
    // For balance calculation, we might need more context if subcategory alone isn't enough
    // but for flow, this is okay. For balance, we fetch ALL for that subcat.
}

interface SubcategoryWithFullHierarchy extends Subcategory {
    category: Category & {
        accountType: AccountType;
    };
}

interface PopulatedRatioForSeed extends Ratio {
    ratioComponents: (RatioComponent & {
        subcategory: SubcategoryWithFullHierarchy | null;
    })[];
}

async function calculateRatioValueForSeed(
    userId: string,
    _evaluationStartDate: Date,
    evaluationEndDate: Date,
    ratio: PopulatedRatioForSeed,
    allTransactionsForPeriod: TransactionData[] // Transactions ONLY within the current eval period
): Promise<number> {
    let numeratorSum = 0;
    let denominatorSum = 0;

    const aggregatedFlowValuesInPeriod: Record<string, { sum: number, count: number }> = {};
    for (const tx of allTransactionsForPeriod) {
        // For flow components, we need to know the account type of the transaction's subcategory.
        // This is hard if `TransactionData` doesn't have it.
        // Let's assume for seeding, we'll look it up if needed, or simplify.
        // OR, ensure `allTransactionsForPeriod` passed to this seed calculator has account type info.
        // For now, we'll use a placeholder. This part needs careful alignment with how service does it.
        // A better approach: The seed script should have access to the same SubcategoryWithFullHierarchy.

        // The `ratio.ratioComponents` ALREADY HAS the full subcategory hierarchy.
        // So, we don't need to check tx.accountTypeName here, but rather component.subcategory.category.accountType.name
        const subId = tx.subcategoryId; // This tx is from the current period
        const componentUsingThisSubcategory = ratio.ratioComponents.find(rc => rc.subcategoryId === subId && rc.subcategory);

        if (componentUsingThisSubcategory &&
            (componentUsingThisSubcategory.subcategory!.category.accountType.name === "Pemasukan" ||
                componentUsingThisSubcategory.subcategory!.category.accountType.name === "Pengeluaran")) {
            if (!aggregatedFlowValuesInPeriod[subId]) {
                aggregatedFlowValuesInPeriod[subId] = { sum: 0, count: 0 };
            }
            aggregatedFlowValuesInPeriod[subId].sum += tx.amount;
            aggregatedFlowValuesInPeriod[subId].count++;
        }
    }

    const getSubcategoryBalance = async (subcategoryId: string): Promise<number> => {
        const transactionsForBalance = await prisma.transaction.findMany({
            where: {
                userId: userId,
                subcategoryId: subcategoryId,
                date: { lte: evaluationEndDate },
                deletedAt: null,
            },
            select: { amount: true }
        });
        return transactionsForBalance.reduce((acc, curr) => acc + curr.amount, 0);
    };

    const processSide = async (side: Side): Promise<number> => {
        let totalSideVal = 0;
        const sideComps = ratio.ratioComponents.filter(
            (rc): rc is RatioComponent & { subcategory: SubcategoryWithFullHierarchy } =>
                rc.deletedAt === null &&
                rc.subcategory != null &&
                rc.subcategory.deletedAt === null &&
                rc.subcategory.category?.accountType != null
        ).filter(rc => rc.side === side);

        for (const component of sideComps) {
            const accountTypeName = component.subcategory.category.accountType.name;
            let valToUse = 0;

            if (accountTypeName === "Aset" || accountTypeName === "Liabilitas") {
                valToUse = await getSubcategoryBalance(component.subcategoryId);
            } else if (accountTypeName === "Pemasukan" || accountTypeName === "Pengeluaran") {
                const aggData = aggregatedFlowValuesInPeriod[component.subcategoryId];
                if (aggData) {
                    if (component.aggregationType === AggregationType.SUM) {
                        valToUse = aggData.sum;
                    } else if (component.aggregationType === AggregationType.AVG) {
                        valToUse = (aggData.count > 0) ? (aggData.sum / aggData.count) : 0;
                    }
                }
            }
            totalSideVal += valToUse * component.sign;
        }
        return totalSideVal;
    };

    numeratorSum = await processSide(Side.numerator);
    denominatorSum = await processSide(Side.denominator);

    if (denominatorSum === 0) {
        if (ratio.code === "LIQUIDITY_RATIO") {
            if (numeratorSum === 0) return 0;
            return Infinity;
        }
        return NaN;
    }
    const rawValue = numeratorSum / denominatorSum;
    return rawValue * (ratio.multiplier ?? 1);
}


async function main() {
    console.log(`Start seeding EvaluationResults ...`);
    const users: User[] = await prisma.user.findMany();
    if (!users.length) { console.log("No users. Skipping."); return; }

    const ratiosFromDbUnfiltered = await prisma.ratio.findMany({
        where: { deletedAt: null },
        include: {
            ratioComponents: {
                where: { deletedAt: null },
                include: {
                    subcategory: { // Include the full hierarchy for subcategory
                        include: {
                            category: {
                                include: {
                                    accountType: true
                                }
                            }
                        }
                    }
                },
            },
        },
    });

    const ratiosFromDb: PopulatedRatioForSeed[] = ratiosFromDbUnfiltered.map(ratio => {
        const activeComponents = ratio.ratioComponents.filter(
            rc => rc.subcategory && rc.subcategory.deletedAt === null &&
                rc.subcategory.category && rc.subcategory.category.deletedAt === null &&
                rc.subcategory.category.accountType && rc.subcategory.category.accountType.deletedAt === null
        );
        // Cast here since we've filtered
        return { ...ratio, ratioComponents: activeComponents as unknown as PopulatedRatioForSeed['ratioComponents'] };
    }).filter(r => r.ratioComponents.length > 0); // Only keep ratios that still have components


    if (!ratiosFromDb.length) { console.log("No active ratios with valid components. Skipping."); return; }

    const today = new Date();
    for (const user of users) {
        console.log(`  Processing user: ${user.name} (ID: ${user.id})`);
        for (let m = 1; m <= 3; m++) {
            const monthToEvaluate = subMonths(today, m);
            const currentMonthEvalStart = startOfMonth(monthToEvaluate);
            const currentMonthEvalEnd = dateFnsEndOfMonth(monthToEvaluate);
            console.log(`    Processing evaluation period: ${currentMonthEvalStart.toISOString().split('T')[0]} to ${currentMonthEvalEnd.toISOString().split('T')[0]}`);

            const transactionsInPeriodForFlow = await prisma.transaction.findMany({
                where: {
                    userId: user.id,
                    date: { gte: currentMonthEvalStart, lte: currentMonthEvalEnd },
                    deletedAt: null,
                },
                select: { id: true, amount: true, subcategoryId: true, date: true },
            });

            if (!transactionsInPeriodForFlow.length) {
                console.log(`      No transactions found in this eval period for user ${user.name}. Results likely INCOMPLETE.`);
            } else {
                console.log(`      Found ${transactionsInPeriodForFlow.length} transactions for flow calculation.`);
            }

            for (const ratio of ratiosFromDb) {
                let calculatedValue = await calculateRatioValueForSeed(
                    user.id,
                    currentMonthEvalStart,
                    currentMonthEvalEnd,
                    ratio,
                    transactionsInPeriodForFlow
                );
                let status: EvaluationStatus = EvaluationStatus.INCOMPLETE;

                if (isNaN(calculatedValue) || !isFinite(calculatedValue)) {
                    calculatedValue = 0; // Store 0 for NaN/Infinity
                    status = EvaluationStatus.INCOMPLETE;
                } else { // Only determine ideal/not ideal if value is valid
                    let isIdeal = false;
                    const { lowerBound, upperBound, isLowerBoundInclusive, isUpperBoundInclusive } = ratio;

                    if (lowerBound !== null && upperBound !== null) {
                        isIdeal = ((isLowerBoundInclusive ?? true) ? calculatedValue >= lowerBound : calculatedValue > lowerBound) &&
                            ((isUpperBoundInclusive ?? true) ? calculatedValue <= upperBound : calculatedValue < upperBound);
                    } else if (lowerBound !== null) {
                        isIdeal = (isLowerBoundInclusive ?? true) ? calculatedValue >= lowerBound : calculatedValue > lowerBound;
                    } else if (upperBound !== null) {
                        isIdeal = (isUpperBoundInclusive ?? true) ? calculatedValue <= upperBound : calculatedValue < upperBound;
                    } else { // No bounds defined for this ratio (or only one side, which is handled above)
                        if (ratio.code === "SOLVENCY_RATIO" && calculatedValue > 0) isIdeal = true;
                        // For other ratios with no bounds, they remain INCOMPLETE unless specific logic says otherwise
                    }
                    // If it was not set to INCOMPLETE by NaN/Infinity, and not by lack of bounds (except Solvency)
                    if (status !== EvaluationStatus.INCOMPLETE || (ratio.code === "SOLVENCY_RATIO" && isIdeal)) {
                        status = isIdeal ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
                    }
                    // If there were no transactions at all for flow calculations, and it's not purely balance based, it's likely incomplete
                    if (transactionsInPeriodForFlow.length === 0 && status !== EvaluationStatus.INCOMPLETE) {
                        // Check if any component relies on flow. If so, and no flow transactions, then INCOMPLETE.
                        const hasFlowComponent = ratio.ratioComponents.some(rc =>
                            rc.subcategory?.category.accountType.name === "Pemasukan" ||
                            rc.subcategory?.category.accountType.name === "Pengeluaran"
                        );
                        if (hasFlowComponent) status = EvaluationStatus.INCOMPLETE;
                    }
                }


                try {
                    await prisma.evaluationResult.upsert({
                        where: { uniq_user_eval_result_dates: { userId: user.id, ratioId: ratio.id, startDate: currentMonthEvalStart, endDate: currentMonthEvalEnd } },
                        update: { value: calculatedValue, status: status, calculatedAt: new Date() },
                        create: { userId: user.id, startDate: currentMonthEvalStart, endDate: currentMonthEvalEnd, ratioId: ratio.id, value: calculatedValue, status: status, calculatedAt: new Date() },
                    });
                    console.log(`        Upserted EvalResult for Ratio "${ratio.title.padEnd(45, ' ')}": Val = ${calculatedValue.toFixed(2).padStart(8, ' ')}, Status: ${status}`);
                } catch (error) {
                    console.error(`        Failed to upsert EvalResult for Ratio "${ratio.title}", Period "${currentMonthEvalStart.toISOString().split('T')[0]}":`, error);
                }
            }
        }
    }
    console.log(`Seeding EvaluationResults finished.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });