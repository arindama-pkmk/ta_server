// src/services/transactionEvaluationService.ts
import { Prisma, Ratio, RatioComponent, Subcategory, Side, AggregationType, EvaluationStatus, EvaluationResult, User } from '@prisma/client';
import {
    TransactionEvaluationRepository,
    PopulatedEvaluationResult,
    CreateEvaluationResultDto
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

// This DTO needs to fully represent the structure, including nested 'ratio'
export interface EvaluationResultDetailDto {
    id: string;
    userId: string;
    // user?: User; // Making user optional or not including if not sent to client
    startDate: Date;
    endDate: Date;
    ratioId: string;
    ratio: Ratio & { // Ensuring ratio is populated for detail view
        ratioComponents: (RatioComponent & {
            subcategory: Subcategory;
        })[];
    };
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
    totalAssets: number; // Properti opsional, akan dihitung
    netWorth: number;    // Properti opsional, akan dihitung
    netIncome: number;   // Properti opsional, akan dihitung
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
        const { lowerBound, upperBound, isLowerBoundInclusive, isUpperBoundInclusive } = ratio;
        let meetsLower = true, meetsUpper = true;
        if (lowerBound !== null) meetsLower = (isLowerBoundInclusive ?? true) ? value >= lowerBound : value > lowerBound;
        if (upperBound !== null) meetsUpper = (isUpperBoundInclusive ?? true) ? value <= upperBound : value < upperBound;

        if (lowerBound !== null && upperBound !== null) return meetsLower && meetsUpper ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (lowerBound !== null) return meetsLower ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (upperBound !== null) return meetsUpper ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        return EvaluationStatus.NOT_IDEAL;
    }

    private calculateSingleRatioValue(transactions: PopulatedTransaction[], ratio: Ratio & { ratioComponents: (RatioComponent & { subcategory: Subcategory })[] }): number {
        let numSum = 0, denSum = 0;
        const processSide = (side: Side): number => {
            let totalSideVal = 0;
            const sideComps = ratio.ratioComponents.filter(c => c.side === side);
            const subcatAggs: Record<string, { sum: number, count: number }> = {};
            for (const comp of sideComps) {
                if (!comp.subcategory) {
                    logger.warn(`RatioComponent ${comp.id} for ratio ${ratio.id} is missing subcategory data.`);
                    continue;
                }
                const subId = comp.subcategoryId;
                subcatAggs[subId] ??= { sum: 0, count: 0 };
            }
            for (const comp of sideComps) {
                if (!comp.subcategory) continue;
                const agg = subcatAggs[comp.subcategoryId];
                let valToUse = 0;
                if (agg) {
                    if (comp.aggregationType === AggregationType.SUM) valToUse = agg.sum;
                    else if (comp.aggregationType === AggregationType.AVG) valToUse = (agg.count > 0) ? (agg.sum / agg.count) : 0;
                }
                totalSideVal += valToUse * comp.sign;
            }
            return totalSideVal;
        };
        numSum = processSide(Side.numerator);
        denSum = processSide(Side.denominator);
        if (denSum === 0) {
            if (ratio.code === "LIQUIDITY_RATIO" && numSum === 0) return 0;
            if (ratio.code === "LIQUIDITY_RATIO" && numSum > 0) return Infinity;
            return NaN;
        }
        return (numSum / denSum) * (ratio.multiplier ?? 1);
    }

    // Full conceptual sums calculation based on Flutter's _TxSums/_computeSums
    private computeConceptualSumsForBreakdown(transactions: PopulatedTransaction[]): ConceptualSums {
        const sums: ConceptualSums = {
            liquid: 0, nonLiquid: 0, liabilities: 0, expense: 0, income: 0,
            savings: 0, debtPayments: 0, deductions: 0, invested: 0,
            totalAssets: 0, netWorth: 0, netIncome: 0
        };

        // These names MUST match the subcategory names in your database for this to work.
        const liquidSubcategoryNames = ['Uang Tunai', 'Uang Rekening Bank', 'Uang E-Wallet', 'Dividen Saham', 'Bunga Obligasi', 'Keuntungan Modal Kripto']; // Adjusted to plausible DB names
        const nonLiquidSubcategoryNames = ['Piutang Usaha', 'Rumah Tinggal', 'Apartemen', 'Ruko', 'Properti Sewa', 'Mobil Pribadi', 'Motor Pribadi', 'Saham Perusahaan', 'Obligasi Pemerintah', 'Reksadana Campuran', 'Aset Kripto', 'Barang Koleksi', 'Perhiasan Emas'];
        const liabilitiesSubcategoryNames = ['Saldo Kartu Kredit', 'Tagihan Utilitas', 'Cicilan Kendaraan', 'Pajak Penghasilan Terhutang', 'Pinjaman Bank', 'KPR Rumah'];
        const expenseSubcategoryNames = ['Tabungan Darurat', 'Belanja Makanan Pokok', 'Minuman Sehari-hari', 'Hadiah Ulang Tahun', 'Donasi Amal', 'Bensin Mobil', 'Tiket Kereta Api', 'Servis Motor', 'Obat-obatan', 'Biaya Dokter', 'Perawatan Wajah', 'Pakaian Kerja', 'Tiket Bioskop', 'Langganan Gym', 'Biaya Kursus Online', 'SPP Anak', 'Cicilan KPR', 'Pajak Bumi Bangunan', 'Premi Asuransi Jiwa', 'Sewa Apartemen', 'Belanja Kebutuhan Rumah Tangga'];
        const incomeSubcategoryNames = ['Gaji Bulanan', 'Upah Harian Proyek', 'Bonus Tahunan', 'Komisi Penjualan', 'Dividen Saham', 'Bunga Deposito', 'Keuntungan Jual Saham', 'Pendapatan Proyek Freelance'];
        const savingsSubcategoryNames = ['Tabungan Darurat', 'Tabungan Pendidikan']; // Might overlap with expenses if 'Tabungan' expense is for saving
        const debtPaymentsSubcategoryNames = ['Cicilan Kendaraan', 'Saldo Kartu Kredit', 'Pinjaman Bank', 'Cicilan KPR'];
        const deductionsSubcategoryNames = ['Pajak Penghasilan Terhutang', 'Premi Asuransi Jiwa', 'Premi Asuransi Kesehatan']; // Typically taxes, insurance premiums
        const investedSubcategoryNames = ['Saham Perusahaan', 'Obligasi Pemerintah', 'Reksadana Campuran', 'Aset Kripto', 'Properti Sewa'];

        for (const tx of transactions) {
            const subName = tx.subcategory.name; // Assumes subcategory is populated
            if (sums) {
                if (liquidSubcategoryNames.includes(subName)) sums.liquid += tx.amount;
                if (nonLiquidSubcategoryNames.includes(subName)) sums.nonLiquid += tx.amount;
                if (liabilitiesSubcategoryNames.includes(subName)) sums.liabilities += tx.amount;
                if (expenseSubcategoryNames.includes(subName)) sums.expense += tx.amount;
                if (incomeSubcategoryNames.includes(subName)) sums.income += tx.amount;
                if (savingsSubcategoryNames.includes(subName)) sums.savings += tx.amount;
                if (debtPaymentsSubcategoryNames.includes(subName)) sums.debtPayments += tx.amount;
                if (deductionsSubcategoryNames.includes(subName)) sums.deductions += tx.amount;
                if (investedSubcategoryNames.includes(subName)) sums.invested += tx.amount;
            }
        }

        sums['totalAssets'] = sums.liquid + sums.nonLiquid;
        sums['netWorth'] = sums.totalAssets - sums.liabilities;
        sums['netIncome'] = sums.income - sums.deductions;
        return sums;
    }

    private validateEvaluationDates(startDate: Date, endDate: Date): void {
        if (!startDate || !endDate) {
            throw new BadRequestError("Start date and end date for evaluation must be provided.");
        }
        if (endDate < startDate) {
            throw new BadRequestError("Evaluation end date cannot be before start date.");
        }
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 29) {
            throw new BadRequestError("Evaluation date range must be at least approximately 1 month (29 days).");
        }
    }

    async calculateAndStoreEvaluations(dto: CalculateEvaluationClientDto, userId: string): Promise<SingleRatioCalculationResultDto[]> {
        const startDate = new Date(dto.startDate); // Ensure they are Date objects
        const endDate = new Date(dto.endDate);
        this.validateEvaluationDates(startDate, endDate);

        const transactionsInPeriod = await this.transactionService.getAllUserTransactions(userId, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        if (transactionsInPeriod.length === 0) {
            logger.warn(`[EvaluationService] No transactions for user ${userId} in period ${startDate.toISOString()} - ${endDate.toISOString()}. Results may be INCOMPLETE or zero.`);
        }

        const allRatios = await prisma.ratio.findMany({
            include: { ratioComponents: { include: { subcategory: true } } },
        });
        if (!allRatios.length) throw new AppError("No ratio definitions found in the database.", 500, false);

        const resultsDto: SingleRatioCalculationResultDto[] = [];
        for (const ratio of allRatios) {
            const populatedRatio = ratio as unknown as Ratio & { ratioComponents: (RatioComponent & { subcategory: Subcategory })[] };
            const calculatedValue = this.calculateSingleRatioValue(transactionsInPeriod, populatedRatio);
            const status = this.determineEvaluationStatus(calculatedValue, populatedRatio);
            const finalValue = (isNaN(calculatedValue) || !isFinite(calculatedValue)) ? 0 : calculatedValue;

            const createDto: CreateEvaluationResultDto = {
                userId,
                startDate,
                endDate,
                ratioId: ratio.id,
                value: finalValue,
                status: status,
                calculatedAt: new Date()
            };
            await this.evaluationRepository.upsert(
                userId, startDate, endDate, ratio.id,
                { value: finalValue, status: status, calculatedAt: new Date() },
                createDto
            );

            resultsDto.push({
                ratioId: ratio.id,
                ratioCode: ratio.code,
                ratioTitle: ratio.title,
                value: finalValue,
                status: status,
                idealRangeDisplay: this.getIdealRangeDisplay(ratio),
            });
        }
        logger.info(`[EvaluationService] Calculated/stored ${resultsDto.length} evaluations for user ${userId}, period ${startDate.toISOString()}-${endDate.toISOString()}`);
        return resultsDto;
    }

    private getIdealRangeDisplay(ratio: Ratio): string | null {
        if (ratio.code === "LIQUIDITY_RATIO") return "3-6 Bulan";
        const lower = ratio.lowerBound;
        const upper = ratio.upperBound;
        const lowerInc = ratio.isLowerBoundInclusive ?? true;
        const upperInc = ratio.isUpperBoundInclusive ?? true;
        const mult = ratio.multiplier ?? 1;
        const unit = mult === 100 ? "%" : "";

        if (lower != null && upper != null) {
            return `${lowerInc ? '>=' : '>'} ${lower}${unit} dan ${upperInc ? '<=' : '<'} ${upper}${unit}`;
        }
        if (lower != null) return `${lowerInc ? '>=' : '>'} ${lower}${unit}`;
        if (upper != null) return `${upperInc ? '<=' : '<'} ${upper}${unit}`;
        return ratio.title.includes("Solvabilitas") ? "> 0%" : "N/A";
    }

    async getEvaluationHistoryForUser(userId: string, queryStartDate?: Date, queryEndDate?: Date): Promise<PopulatedEvaluationResult[]> {
        logger.info(`[EvaluationService] Fetching evaluation history for user ${userId}`);
        return this.evaluationRepository.findAllByUserIdAndOptionalDateRange(
            userId,
            {
                customStartDate: queryStartDate, // Gunakan customStartDate
                customEndDate: queryEndDate,   // Gunakan customEndDate
                orderBy: [{ startDate: 'desc' }, { calculatedAt: 'desc' }]
            }
        );
    }

    async getEvaluationDetailById(evaluationResultId: string, userId: string): Promise<EvaluationResultDetailDto> {
        const resultFromRepo = await this.evaluationRepository.findById(evaluationResultId);
        if (!resultFromRepo || resultFromRepo.userId !== userId) {
            throw new NotFoundError(`Evaluation result ID ${evaluationResultId} not found or access denied.`);
        }

        // Fetch the full EvaluationResult with its relations for breakdown calculation
        // This ensures we have the 'ratio.ratioComponents' needed.
        const fullResultFromDb = await prisma.evaluationResult.findUnique({
            where: { id: evaluationResultId },
            include: {
                ratio: { include: { ratioComponents: { include: { subcategory: true } } } },
                user: true, // Include user if needed for detail, or set to false
            }
        });

        if (!fullResultFromDb) {
            throw new NotFoundError(`Evaluation result with ID ${evaluationResultId} consistency error.`);
        }

        const transactionsInPeriod = await this.transactionService.getAllUserTransactions(userId, {
            startDate: fullResultFromDb.startDate.toISOString(),
            endDate: fullResultFromDb.endDate.toISOString(),
        });

        const conceptualSums = this.computeConceptualSumsForBreakdown(transactionsInPeriod);
        const breakdownComponentsDto: ConceptualComponentValueDto[] = [];
        const ratioCode = fullResultFromDb.ratio.code;

        if (ratioCode === "LIQUIDITY_RATIO") { // ID '0' in Flutter
            breakdownComponentsDto.push({ name: "Total Aset Likuid (Pembilang)", value: conceptualSums.liquid });
            breakdownComponentsDto.push({ name: "Total Pengeluaran Bulanan (Penyebut)", value: conceptualSums.expense });
        } else if (ratioCode === "LIQUID_ASSETS_TO_NET_WORTH_RATIO") { // ID '1'
            breakdownComponentsDto.push({ name: "Total Aset Likuid (Pembilang)", value: conceptualSums.liquid });
            breakdownComponentsDto.push({ name: "Total Kekayaan Bersih (Penyebut)", value: conceptualSums.netWorth });
        } else if (ratioCode === "DEBT_TO_ASSET_RATIO") { // ID '2'
            breakdownComponentsDto.push({ name: "Total Utang (Pembilang)", value: conceptualSums.liabilities });
            breakdownComponentsDto.push({ name: "Total Aset (Penyebut)", value: conceptualSums.totalAssets });
        } else if (ratioCode === "SAVING_RATIO") { // ID '3'
            breakdownComponentsDto.push({ name: "Total Tabungan (Pembilang)", value: conceptualSums.savings });
            breakdownComponentsDto.push({ name: "Penghasilan Kotor (Penyebut)", value: conceptualSums.income });
        } else if (ratioCode === "DEBT_SERVICE_RATIO") { // ID '4'
            breakdownComponentsDto.push({ name: "Total Pembayaran Utang Bulanan (Pembilang)", value: conceptualSums.debtPayments });
            breakdownComponentsDto.push({ name: "Penghasilan Bersih (Penyebut)", value: conceptualSums.netIncome });
        } else if (ratioCode === "INVESTMENT_ASSETS_TO_NET_WORTH_RATIO") { // ID '5'
            breakdownComponentsDto.push({ name: "Total Aset Diinvestasikan (Pembilang)", value: conceptualSums.invested });
            breakdownComponentsDto.push({ name: "Total Kekayaan Bersih (Penyebut)", value: conceptualSums.netWorth });
        } else if (ratioCode === "SOLVENCY_RATIO") { // ID '6'
            breakdownComponentsDto.push({ name: "Total Kekayaan Bersih (Pembilang)", value: conceptualSums.netWorth });
            breakdownComponentsDto.push({ name: "Total Aset (Penyebut)", value: conceptualSums.totalAssets });
        }


        let calcNum = 0, calcDen = 0;
        const populatedRatioForCalc = fullResultFromDb.ratio as unknown as Ratio & { ratioComponents: (RatioComponent & { subcategory: Subcategory })[] };
        const processSideForBreakdown = (side: Side): number => {
            let totalSideVal = 0;
            const sideComps = populatedRatioForCalc.ratioComponents.filter(c => c.side === side);
            const subcatAggs: Record<string, { sum: number, count: number }> = {};
            for (const comp of sideComps) {
                if (!comp.subcategory) continue;
                const subId = comp.subcategoryId;
                subcatAggs[subId] ??= { sum: 0, count: 0 };
                transactionsInPeriod.filter(t => t.subcategoryId === subId).forEach(tx => {
                    if (subcatAggs[subId]) {
                        subcatAggs[subId].sum += tx.amount;
                        subcatAggs[subId].count++;
                    }
                });
            }
            for (const comp of sideComps) {
                if (!comp.subcategory) continue;
                const agg = subcatAggs[comp.subcategoryId]; let valToUse = 0;
                if (agg) {
                    if (comp.aggregationType === AggregationType.SUM) valToUse = agg.sum;
                    else if (comp.aggregationType === AggregationType.AVG) valToUse = (agg.count > 0) ? (agg.sum / agg.count) : 0;
                }
                totalSideVal += valToUse * comp.sign;
            }
            return totalSideVal;
        };
        calcNum = processSideForBreakdown(Side.numerator);
        calcDen = processSideForBreakdown(Side.denominator);

        // Cast to the DTO, ensure all fields are mapped correctly
        const detailDto: EvaluationResultDetailDto = {
            id: fullResultFromDb.id,
            userId: fullResultFromDb.userId,
            // user: fullResultFromDb.user, // Include if your DTO and client needs it
            startDate: fullResultFromDb.startDate,
            endDate: fullResultFromDb.endDate,
            ratioId: fullResultFromDb.ratioId,
            ratio: fullResultFromDb.ratio as unknown as EvaluationResultDetailDto['ratio'], // Cast needed for nested types
            value: fullResultFromDb.value,
            status: fullResultFromDb.status,
            calculatedAt: fullResultFromDb.calculatedAt,
            createdAt: fullResultFromDb.createdAt,
            updatedAt: fullResultFromDb.updatedAt,
            deletedAt: fullResultFromDb.deletedAt,
            breakdownComponents: breakdownComponentsDto.length > 0 ? breakdownComponentsDto : [],
            calculatedNumerator: calcNum,
            calculatedDenominator: calcDen,
        };
        return detailDto;
    }
}