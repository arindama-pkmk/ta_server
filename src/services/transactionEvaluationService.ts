// src/services/transactionEvaluationService.ts
import { Ratio, RatioComponent, Subcategory, Side, EvaluationStatus, EvaluationResult, Category, AccountType, User } from '@prisma/client';
import {
    TransactionEvaluationRepository,
    CreateEvaluationResultDto,
    PopulatedEvaluationResult as RepoPopulatedEvaluationResult // Alias to avoid conflict if local types are similar
} from '../repositories/transactionEvaluationRepository';
import { TransactionService, PopulatedTransaction } from './transactionService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import prisma from '../config/database';
import logger from '../utils/logger';
import { AppError, BadRequestError, NotFoundError } from '../utils/errorHandler';

export interface CalculateEvaluationClientDto {
    startDate: Date;
    endDate: Date;
}

export interface SingleRatioCalculationResultDto {
    ratioId: string;
    ratioCode: string;
    ratioTitle: string;
    value: number;
    status: EvaluationStatus;
    idealRangeDisplay?: string | null;
}

export interface ConceptualComponentValueDto {
    name: string;
    value: number;
}

// Define more precise types for populated data
interface SubcategoryWithFullHierarchy extends Subcategory {
    category: Category & {
        accountType: AccountType;
    };
}

interface PopulatedRatioWithAccountTypedComponents extends Ratio {
    ratioComponents: (RatioComponent & {
        subcategory: SubcategoryWithFullHierarchy; // Subcategory includes its full hierarchy
    })[];
}

interface PopulatedEvaluationResultWithRatio extends EvaluationResult { // This represents EvaluationResult fully populated
    ratio: PopulatedRatioWithAccountTypedComponents;
    user?: User; // Optional user include
}

export interface EvaluationResultDetailDto {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    ratioId: string;
    ratio: PopulatedRatioWithAccountTypedComponents;
    value: number;
    status: EvaluationStatus;
    calculatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    breakdownComponents?: ConceptualComponentValueDto[];
    calculatedNumerator?: number;
    calculatedDenominator?: number;
}

export interface ConceptualSums {
    liquid: number;
    nonLiquid: number;
    liabilities: number;
    expense: number;
    income: number;
    savings: number;
    debtPayments: number;
    deductions: number;
    invested: number;
    totalAssets: number;
    netWorth: number;
    netIncome: number;
}


@injectable()
export class TransactionEvaluationService {
    private readonly evaluationRepository: TransactionEvaluationRepository;
    private readonly transactionService: TransactionService;

    constructor(
        @inject(TYPES.TransactionEvaluationRepository) evaluationRepository: TransactionEvaluationRepository,
        @inject(TYPES.TransactionService) transactionService: TransactionService
    ) {
        this.evaluationRepository = evaluationRepository;
        this.transactionService = transactionService;
    }


    private determineEvaluationStatus(value: number, ratio: Ratio): EvaluationStatus {
        if (isNaN(value) || !isFinite(value)) return EvaluationStatus.INCOMPLETE;
        const { lowerBound, upperBound, isLowerBoundInclusive, isUpperBoundInclusive, code } = ratio;

        if (code === "LIQUIDITY_RATIO") {
            // Liquidity: Ideal if value >= lowerBound (e.g., >= 3)
            return (lowerBound !== null && value >= lowerBound) ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        }
        if (code === "SOLVENCY_RATIO") {
            // Solvency: Ideal if > 0. (seed has lowerBound: 0.00001, isLowerBoundInclusive: false)
            return (lowerBound !== null && value > lowerBound) ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        }

        let meetsLower = true, meetsUpper = true;
        if (lowerBound !== null) meetsLower = (isLowerBoundInclusive ?? true) ? value >= lowerBound : value > lowerBound;
        if (upperBound !== null) meetsUpper = (isUpperBoundInclusive ?? true) ? value <= upperBound : value < upperBound;

        if (lowerBound !== null && upperBound !== null) return meetsLower && meetsUpper ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (lowerBound !== null) return meetsLower ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (upperBound !== null) return meetsUpper ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (ratio.code === "SOLVENCY_RATIO" && value > 0) return EvaluationStatus.IDEAL;
        return EvaluationStatus.NOT_IDEAL;
    }

    private async calculateSingleRatioValue(
        userId: string,
        _evaluationStartDate: Date,
        evaluationEndDate: Date,
        ratio: PopulatedRatioWithAccountTypedComponents,
        allTransactionsForPeriod: PopulatedTransaction[]
    ): Promise<number> {
        let numeratorSum = 0;
        let denominatorSum = 0;

        const aggregatedFlowValuesInPeriod: Record<string, { sum: number, count: number }> = {};
        for (const tx of allTransactionsForPeriod) {
            if (tx.subcategory?.category?.accountType?.name === "Pemasukan" ||
                tx.subcategory?.category?.accountType?.name === "Pengeluaran") {
                const subId = tx.subcategoryId;
                aggregatedFlowValuesInPeriod[subId] ??= { sum: 0, count: 0 };
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
                        valToUse = aggData.sum;
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


    private computeConceptualSumsForBreakdown(transactions: PopulatedTransaction[]): ConceptualSums {
        const sums: ConceptualSums = {
            liquid: 0, nonLiquid: 0, liabilities: 0, expense: 0, income: 0,
            savings: 0, debtPayments: 0, deductions: 0, invested: 0,
            totalAssets: 0, netWorth: 0, netIncome: 0
        };
        // These names MUST match the subcategory names in your database (from seedCategoriesAndSubcategories.ts)
        const liquidSubcategoryNames = ['Uang Tunai', 'Uang Rekening Bank', 'Uang E-Wallet', 'Dividen', 'Bunga', 'Untung Modal'];
        const nonLiquidSubcategoryNames = ['Piutang', 'Rumah', 'Apartemen', 'Ruko', 'Gudang', 'Kios', 'Properti Sewa', 'Kendaraan', 'Elektronik', 'Furnitur', 'Saham', 'Obligasi', 'Reksadana', 'Kripto', 'Koleksi', 'Perhiasan'];
        const liabilitiesSubcategoryNames = ['Saldo Kartu Kredit', 'Tagihan', 'Cicilan', 'Pajak', 'Pinjaman', 'Pinjaman Properti'];
        // For expense & income, we will primarily sum by AccountType, but some specific subcategories are needed for conceptual sums like "Savings" or "DebtPayments"
        const savingsSubcategoryNames = ['Tabungan']; // This is an "Pengeluaran" subcategory
        const debtPaymentsSubcategoryNames = ['Cicilan', 'Saldo Kartu Kredit', 'Pinjaman', 'Pinjaman Properti', 'Bayar pinjaman']; // These are "Pengeluaran" or "Liabilitas"
        const deductionsSubcategoryNames = ['Pajak', 'Bayar asuransi']; // 'Pajak' here is an "Pengeluaran" for tax payment, 'Bayar asuransi' is "Pengeluaran"
        const investedSubcategoryNames = ['Saham', 'Obligasi', 'Reksadana', 'Kripto', 'Properti Sewa']; // These are "Aset" subcategories

        for (const tx of transactions) {
            if (!tx.subcategory?.category?.accountType) {
                logger.warn(`[EvaluationService] Transaction ${tx.id} missing full subcategory details for conceptual sum.`);
                continue;
            }
            const subName = tx.subcategory.name;
            const accTypeName = tx.subcategory.category.accountType.name;

            // Sum main Pemasukan and Pengeluaran
            if (accTypeName === "Pemasukan") {
                sums.income += tx.amount;
            } else if (accTypeName === "Pengeluaran") {
                sums.expense += tx.amount;
                // Specific expense types for conceptual sums
                if (savingsSubcategoryNames.includes(subName)) sums.savings += tx.amount;
                if (debtPaymentsSubcategoryNames.includes(subName)) sums.debtPayments += tx.amount;
                if (deductionsSubcategoryNames.includes(subName)) sums.deductions += tx.amount;
            }

            // For assets and liabilities, we sum based on the specific subcategory names
            // This assumes transactions to these subcategories represent their total value or change contributing to it.
            // The "initial balance" transactions are key here.
            if (liquidSubcategoryNames.includes(subName)) sums.liquid += tx.amount;
            if (nonLiquidSubcategoryNames.includes(subName)) sums.nonLiquid += tx.amount;
            if (investedSubcategoryNames.includes(subName)) sums.invested += tx.amount; // This will double-count if subName is also in nonLiquid, which is fine for this conceptual sum.
            if (liabilitiesSubcategoryNames.includes(subName)) sums.liabilities += tx.amount;
        }

        sums.totalAssets = sums.liquid + sums.nonLiquid;
        sums.netWorth = sums.totalAssets - sums.liabilities;
        sums.netIncome = sums.income - sums.deductions; // Assuming 'deductions' are correctly identified expenses
        return sums;
    }

    private validateEvaluationDates(startDate: Date, endDate: Date): void {
        if (!startDate || !endDate) {
            throw new BadRequestError("Start date and end date for evaluation must be provided.");
        }
        if (endDate < startDate) {
            throw new BadRequestError("Evaluation end date cannot be before start date.");
        }
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

        if (diffDays < 28) {
            logger.warn(`[EvaluationService] Evaluation date range is less than 28 days (${diffDays} days). This might be too short for meaningful monthly ratios.`);
        }
        if (diffDays > 92) { // Approx 3 months + a bit buffer
            throw new BadRequestError("Evaluation date range should not exceed ~3 months.");
        }
    }

    async calculateAndStoreEvaluations(dto: CalculateEvaluationClientDto, userId: string): Promise<SingleRatioCalculationResultDto[]> {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        this.validateEvaluationDates(startDate, endDate);

        const transactionsInPeriod = await this.transactionService.getAllUserTransactions(userId, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        if (transactionsInPeriod.length === 0) {
            logger.warn(`[EvaluationService] No transactions for user ${userId} in period ${startDate.toISOString()} - ${endDate.toISOString()}.`);
        }

        const allRatiosFromDbUnfiltered = await prisma.ratio.findMany({
            where: { deletedAt: null },
            include: {
                ratioComponents: {
                    where: { deletedAt: null },
                    include: {
                        subcategory: {
                            include: {
                                category: {
                                    include: {
                                        accountType: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        const allRatiosFromDb: PopulatedRatioWithAccountTypedComponents[] = allRatiosFromDbUnfiltered.map(ratio => {
            const activeComponents = ratio.ratioComponents.filter(
                (rc): rc is RatioComponent & { subcategory: SubcategoryWithFullHierarchy } =>
                    rc.subcategory != null && rc.subcategory.deletedAt === null &&
                    rc.subcategory.category != null && rc.subcategory.category.deletedAt === null &&
                    rc.subcategory.category.accountType != null && rc.subcategory.category.accountType.deletedAt === null
            );
            return { ...ratio, ratioComponents: activeComponents };
        }).filter(r => r.code === "LIQUIDITY_RATIO" || r.ratioComponents.length > 0); // Allow liquidity even if no expense components for some reason (will result in Infinity/0)

        if (!allRatiosFromDb.length) throw new AppError("No active ratio definitions with valid components found.", 500, false);

        const resultsDto: SingleRatioCalculationResultDto[] = [];
        for (const ratioFromDb of allRatiosFromDb) {
            const calculatedValue = await this.calculateSingleRatioValue(
                userId,
                startDate,
                endDate,
                ratioFromDb,
                transactionsInPeriod
            );
            const status = this.determineEvaluationStatus(calculatedValue, ratioFromDb);
            const valueToStore = (status === EvaluationStatus.INCOMPLETE || !isFinite(calculatedValue)) ? 0 : calculatedValue;

            const createDto: CreateEvaluationResultDto = {
                userId, startDate, endDate, ratioId: ratioFromDb.id,
                value: valueToStore, status: status, calculatedAt: new Date()
            };
            await this.evaluationRepository.upsert(
                userId, startDate, endDate, ratioFromDb.id,
                { value: valueToStore, status: status, calculatedAt: new Date() },
                createDto
            );

            resultsDto.push({
                ratioId: ratioFromDb.id,
                ratioCode: ratioFromDb.code,
                ratioTitle: ratioFromDb.title,
                value: valueToStore,
                status: status,
                idealRangeDisplay: this.getIdealRangeDisplay(ratioFromDb),
            });
        }
        logger.info(`[EvalService] Calculated/stored ${resultsDto.length} evals for user ${userId}, period ${startDate.toISOString()}-${endDate.toISOString()}`);
        return resultsDto;
    }

    private getIdealRangeDisplay(ratio: Ratio): string | null {
        // Primarily use the idealText from the Ratio model (set by seed)
        if (ratio.idealText && ratio.idealText !== "Rentang ideal tidak ditentukan" && ratio.idealText !== "N/A") {
            return ratio.idealText;
        }

        // Fallback construction if idealText is missing or generic (should be rare after seed update)
        const { code, lowerBound, upperBound, multiplier } = ratio;
        let unit: string;
        if ((multiplier ?? 1) === 100) {
            unit = "%";
        } else if (code === "LIQUIDITY_RATIO") {
            unit = " Bulan";
        } else {
            unit = "";
        }
        const formatBound = (val: number | null) => val != null ? val.toFixed(0) : '';

        if (code === "LIQUIDITY_RATIO") return `≥ ${formatBound(lowerBound)}${unit}`;
        if (code === "SOLVENCY_RATIO") return "-";

        if (lowerBound !== null && upperBound !== null) {
            return `${formatBound(lowerBound)}${unit} - ${formatBound(upperBound)}${unit}`;
        }
        if (lowerBound !== null) {
            return `≥ ${formatBound(lowerBound)}${unit}`;
        }
        if (upperBound !== null) {
            return `≤ ${formatBound(upperBound)}${unit}`;
        }

        return "Rentang ideal tidak ditentukan";
    }

    async getEvaluationHistoryForUser(userId: string, queryStartDate?: Date, queryEndDate?: Date): Promise<RepoPopulatedEvaluationResult[]> {
        logger.info(`[EvaluationService] Fetching evaluation history for user ${userId}`);
        return this.evaluationRepository.findAllByUserIdAndOptionalDateRange(
            userId,
            {
                customStartDate: queryStartDate,
                customEndDate: queryEndDate,
                orderBy: [{ startDate: 'desc' }, { calculatedAt: 'desc' }]
            }
        );
    }

    async getEvaluationDetailById(evaluationResultId: string, userId: string): Promise<EvaluationResultDetailDto> {
        const fullResultFromDbRaw = await prisma.evaluationResult.findUnique({
            where: { id: evaluationResultId, userId: userId, deletedAt: null },
            include: {
                ratio: {
                    include: {
                        ratioComponents: {
                            where: { deletedAt: null },
                            include: {
                                subcategory: {
                                    include: {
                                        category: {
                                            include: {
                                                accountType: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            }
        });

        if (!fullResultFromDbRaw || !fullResultFromDbRaw.ratio || fullResultFromDbRaw.ratio.deletedAt !== null) {
            throw new NotFoundError(`Evaluation result ID ${evaluationResultId} not found, or refers to a deleted ratio.`);
        }

        const originalRatio = fullResultFromDbRaw.ratio;
        const activeComponents = originalRatio.ratioComponents.filter(
            (rc): rc is RatioComponent & { subcategory: SubcategoryWithFullHierarchy } =>
                rc.subcategory != null && rc.subcategory.deletedAt === null &&
                rc.subcategory.category != null && rc.subcategory.category.deletedAt === null &&
                rc.subcategory.category.accountType != null && rc.subcategory.category.accountType.deletedAt === null
        );
        const filteredRatio: PopulatedRatioWithAccountTypedComponents = { ...originalRatio, ratioComponents: activeComponents };

        const populatedResult: PopulatedEvaluationResultWithRatio = {
            ...fullResultFromDbRaw,
            ratio: filteredRatio
        };

        const transactionsInPeriod = await this.transactionService.getAllUserTransactions(userId, {
            startDate: populatedResult.startDate.toISOString(),
            endDate: populatedResult.endDate.toISOString(),
        });

        const conceptualSums = this.computeConceptualSumsForBreakdown(transactionsInPeriod);
        const breakdownComponentsDto: ConceptualComponentValueDto[] = [];
        const ratioCode = populatedResult.ratio.code;

        // --- THIS IS THE PREVIOUSLY OMITTED PART ---
        if (ratioCode === "LIQUIDITY_RATIO") {
            breakdownComponentsDto.push({ name: "Total Aset Likuid (Pembilang)", value: conceptualSums.liquid });
            breakdownComponentsDto.push({ name: "Total Pengeluaran Bulanan (Penyebut)", value: conceptualSums.expense });
        } else if (ratioCode === "LIQUID_ASSETS_TO_NET_WORTH_RATIO") {
            breakdownComponentsDto.push({ name: "Total Aset Likuid (Pembilang)", value: conceptualSums.liquid });
            breakdownComponentsDto.push({ name: "Total Kekayaan Bersih (Penyebut)", value: conceptualSums.netWorth });
        } else if (ratioCode === "DEBT_TO_ASSET_RATIO") {
            breakdownComponentsDto.push({ name: "Total Utang (Pembilang)", value: conceptualSums.liabilities });
            breakdownComponentsDto.push({ name: "Total Aset (Penyebut)", value: conceptualSums.totalAssets });
        } else if (ratioCode === "SAVING_RATIO") {
            breakdownComponentsDto.push({ name: "Total Tabungan (Pembilang)", value: conceptualSums.savings });
            breakdownComponentsDto.push({ name: "Penghasilan Kotor (Penyebut)", value: conceptualSums.income });
        } else if (ratioCode === "DEBT_SERVICE_RATIO") {
            breakdownComponentsDto.push({ name: "Total Pembayaran Utang Bulanan (Pembilang)", value: conceptualSums.debtPayments });
            breakdownComponentsDto.push({ name: "Penghasilan Bersih (Penyebut)", value: conceptualSums.netIncome });
        } else if (ratioCode === "INVESTMENT_ASSETS_TO_NET_WORTH_RATIO") {
            breakdownComponentsDto.push({ name: "Total Aset Diinvestasikan (Pembilang)", value: conceptualSums.invested });
            breakdownComponentsDto.push({ name: "Total Kekayaan Bersih (Penyebut)", value: conceptualSums.netWorth });
        } else if (ratioCode === "SOLVENCY_RATIO") {
            breakdownComponentsDto.push({ name: "Total Kekayaan Bersih (Pembilang)", value: conceptualSums.netWorth });
            breakdownComponentsDto.push({ name: "Total Aset (Penyebut)", value: conceptualSums.totalAssets });
        }
        // --- END OF OMITTED PART ---

        let calcNum = 0, calcDen = 0;
        // To get the exact num/den for display, we re-run the processSide logic
        const processSideForBreakdown = async (side: Side): Promise<number> => {
            let totalSideVal = 0;
            const sideComps = populatedResult.ratio.ratioComponents.filter(rc => rc.side === side);

            const aggregatedFlowValuesInPeriod: Record<string, { sum: number, count: number }> = {};
            for (const tx of transactionsInPeriod) { // Use transactionsInPeriod (already fetched)
                if (tx.subcategory?.category?.accountType?.name === "Pemasukan" ||
                    tx.subcategory?.category?.accountType?.name === "Pengeluaran") {
                    const subId = tx.subcategoryId;
                    aggregatedFlowValuesInPeriod[subId] ??= { sum: 0, count: 0 };
                    aggregatedFlowValuesInPeriod[subId].sum += tx.amount;
                    aggregatedFlowValuesInPeriod[subId].count++;
                }
            }
            const getSubcategoryBalanceForBreakdown = async (subcategoryId: string): Promise<number> => {
                const txs = await prisma.transaction.findMany({
                    where: { userId, subcategoryId, date: { lte: populatedResult.endDate }, deletedAt: null },
                    select: { amount: true }
                });
                return txs.reduce((acc, curr) => acc + curr.amount, 0);
            };

            for (const component of sideComps) {
                const accountTypeName = component.subcategory.category.accountType.name;
                let valToUse = 0;
                if (accountTypeName === "Aset" || accountTypeName === "Liabilitas") {
                    valToUse = await getSubcategoryBalanceForBreakdown(component.subcategoryId);
                } else if (accountTypeName === "Pemasukan" || accountTypeName === "Pengeluaran") {
                    const aggData = aggregatedFlowValuesInPeriod[component.subcategoryId];
                    if (aggData) {
                        valToUse = aggData.sum;
                    }
                }
                totalSideVal += valToUse * component.sign;
            }
            return totalSideVal;
        };
        calcNum = await processSideForBreakdown(Side.numerator);
        calcDen = await processSideForBreakdown(Side.denominator);

        const detailDto: EvaluationResultDetailDto = {
            id: populatedResult.id,
            userId: populatedResult.userId,
            startDate: populatedResult.startDate,
            endDate: populatedResult.endDate,
            ratioId: populatedResult.ratioId,
            ratio: populatedResult.ratio, // This is already PopulatedRatioWithAccountTypedComponents
            value: populatedResult.value,
            status: populatedResult.status,
            calculatedAt: populatedResult.calculatedAt,
            createdAt: populatedResult.createdAt,
            updatedAt: populatedResult.updatedAt,
            deletedAt: populatedResult.deletedAt,
            breakdownComponents: breakdownComponentsDto.length > 0 ? breakdownComponentsDto : [],
            calculatedNumerator: calcNum,
            calculatedDenominator: calcDen,
        };
        return detailDto;
    }
}