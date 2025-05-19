// src/services/transactionEvaluationService.ts
import {
    Prisma, Ratio,
    RatioComponent, Subcategory, Side, AggregationType, EvaluationStatus
} from '@prisma/client';
import {
    TransactionEvaluationRepository,
    // CreateEvaluationResultDto, // DTOs might be internal to service if controller doesn't create directly
    // UpdateEvaluationResultDto,
    PopulatedEvaluationResult
} from '../repositories/transactionEvaluationRepository';
import { PeriodService } from './periodService';
import { TransactionService, PopulatedTransaction } from './transactionService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import prisma from '../config/database';
import logger from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errorHandler';

// DTO for requesting an evaluation calculation from the controller
export interface CalculateEvaluationClientDto {
    // userId is from AuthRequest
    periodId: string;
    // ratioCodes?: string[]; // Optional: to calculate only specific ratios
}

// DTO for the result of a single ratio calculation returned to the controller
export interface SingleRatioCalculationResultDto {
    ratioId: string;
    ratioCode: string;
    ratioTitle: string;
    value: number;
    status: EvaluationStatus;
    idealRangeDisplay?: string | null; // From Ratio.idealText or similar
}

// DTO for detailed evaluation result with breakdown for the controller
export interface EvaluationResultDetailDto extends PopulatedEvaluationResult { // Use PopulatedEvaluationResult as base
    breakdownComponents?: ConceptualComponentValueDto[];
    calculatedNumerator?: number;
    calculatedDenominator?: number;
}
export interface ConceptualComponentValueDto { // Matches frontend
    name: string;
    value: number;
}


@injectable()
export class TransactionEvaluationService {
    private readonly evaluationRepository: TransactionEvaluationRepository;
    private readonly periodService: PeriodService;
    private readonly transactionService: TransactionService;

    constructor(
        @inject(TYPES.TransactionEvaluationRepository) evaluationRepository: TransactionEvaluationRepository,
        @inject(TYPES.PeriodService) periodService: PeriodService,
        @inject(TYPES.TransactionService) transactionService: TransactionService
    ) {
        this.evaluationRepository = evaluationRepository;
        this.periodService = periodService;
        this.transactionService = transactionService;
    }

    // Helper for determining status (from previous implementation)
    private determineEvaluationStatus(value: number, ratio: Ratio & { ratioComponents: RatioComponent[] }): EvaluationStatus {
        if (isNaN(value) || !isFinite(value)) return EvaluationStatus.INCOMPLETE;
        const { lowerBound, upperBound, isLowerBoundInclusive, isUpperBoundInclusive } = ratio;
        let meetsLower = true, meetsUpper = true;
        if (lowerBound !== null) meetsLower = isLowerBoundInclusive ?? true ? value >= lowerBound : value > lowerBound;
        if (upperBound !== null) meetsUpper = isUpperBoundInclusive ?? true ? value <= upperBound : value < upperBound;
        if (lowerBound !== null && upperBound !== null) return meetsLower && meetsUpper ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (lowerBound !== null) return meetsLower ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        if (upperBound !== null) return meetsUpper ? EvaluationStatus.IDEAL : EvaluationStatus.NOT_IDEAL;
        return EvaluationStatus.NOT_IDEAL; // Default if no bounds
    }

    // Helper for calculating a single ratio (from previous implementation)
    private calculateSingleRatioValue(transactions: PopulatedTransaction[], ratio: Ratio & { ratioComponents: (RatioComponent & { subcategory: Subcategory })[] }): number {
        let numSum = 0, denSum = 0;
        const processSide = (side: Side): number => {
            let totalSideVal = 0;
            const sideComps = ratio.ratioComponents.filter(c => c.side === side);
            const subcatAggs: Record<string, { sum: number, count: number }> = {};
            for (const comp of sideComps) {
                if (!comp.subcategory) continue;
                const subId = comp.subcategoryId;
                subcatAggs[subId] ??= { sum: 0, count: 0 };
                transactions.filter(t => t.subcategoryId === subId).forEach(tx => {
                    if (subcatAggs[subId]) {
                        subcatAggs[subId].sum += tx.amount;
                        subcatAggs[subId].count++;
                    }
                });
            }
            for (const comp of sideComps) {
                if (!comp.subcategory) continue;
                const agg = subcatAggs[comp.subcategoryId]; let valToUse = 0;
                if (comp.aggregationType === AggregationType.SUM) valToUse = agg?.sum || 0;
                else if (comp.aggregationType === AggregationType.AVG) valToUse = (agg && agg.count > 0) ? (agg.sum / agg.count) : 0;
                totalSideVal += valToUse * comp.sign;
            }
            return totalSideVal;
        };
        numSum = processSide(Side.numerator); denSum = processSide(Side.denominator);
        if (denSum === 0) {
            if (ratio.code === "LIQUIDITY_RATIO" && numSum === 0) return 0;
            if (ratio.code === "LIQUIDITY_RATIO" && numSum > 0) return Infinity; // Handled by INCOMPLETE status
            return NaN; // Handled by INCOMPLETE status
        }
        return (numSum / denSum) * (ratio.multiplier || 1);
    }

    // Helper for conceptual sums (from previous implementation)
    private computeConceptualSumsForBreakdown(transactions: PopulatedTransaction[]): Record<string, number> {
        const sums: Record<string, number> = { /* ... as before ... */ };
        const conceptualMappings: Record<string, string[]> = { /* ... as before ... */ };
        const subcatNameToIdAndDetails: Record<string, { id: string, categoryId: string, categoryName: string }> = {};

        transactions.forEach(tx => {
            if (tx.subcategory) { // Ensure subcategory is populated
                subcatNameToIdAndDetails[tx.subcategory.name] = {
                    id: tx.subcategoryId,
                    categoryId: tx.subcategory.categoryId,
                    categoryName: tx.subcategory.category.name
                };
            }
        });

        for (const tx of transactions) {
            for (const conceptualKey in conceptualMappings) {
                const subcatNamesForConcept = conceptualMappings[conceptualKey];
                // Match by subcategory name as defined in conceptualMappings
                if (tx.subcategory && subcatNamesForConcept?.includes(tx.subcategory.name)) {
                    sums[conceptualKey] = (sums[conceptualKey] || 0) + tx.amount;
                }
            }
        }
        sums['netWorth'] = ((sums['liquid'] ?? 0) + (sums['nonLiquid'] ?? 0)) - (sums['liabilities'] ?? 0);
        sums['totalAssets'] = (sums['liquid'] ?? 0) + (sums['nonLiquid'] ?? 0);
        sums['netIncome'] = (sums['income'] ?? 0) - (sums['deductions'] ?? 0);
        return sums;
    }


    // PSPEC 4.2: Calculate all ratios for a given user and period, then store them
    async calculateAndStoreEvaluations(dto: CalculateEvaluationClientDto, userId: string): Promise<SingleRatioCalculationResultDto[]> {
        const { periodId } = dto;
        const period = await this.periodService.getPeriodById(periodId, userId); // Validates ownership & existence

        // PSPEC 4.1: Period validation for evaluation
        this.periodService.validatePeriodDatesLogic(period.startDate, period.endDate, period.periodType);
        if (period.periodType !== 'general_evaluation' && period.periodType !== 'expense' && period.periodType !== 'income') { // Assuming evaluations can run on any type if desired
            logger.warn(`[EvaluationService] Period ${periodId} type ${period.periodType} may not be standard for evaluation.`);
        }

        const transactionsInPeriod = await this.transactionService.getAllUserTransactions(userId, {
            startDate: period.startDate.toISOString(),
            endDate: period.endDate.toISOString(),
        });

        if (transactionsInPeriod.length === 0) {
            logger.warn(`[EvaluationService] No transactions for user ${userId} in period ${periodId}. Results may be INCOMPLETE or zero.`);
        }

        const allRatios = await prisma.ratio.findMany({
            include: { ratioComponents: { include: { subcategory: true } } },
        });
        if (!allRatios.length) throw new AppError("No ratio definitions found.", 500, false);

        const resultsDto: SingleRatioCalculationResultDto[] = [];

        for (const ratio of allRatios) {
            const populatedRatio = ratio as Ratio & { ratioComponents: (RatioComponent & { subcategory: Subcategory })[] };
            const calculatedValue = this.calculateSingleRatioValue(transactionsInPeriod, populatedRatio);
            const status = this.determineEvaluationStatus(calculatedValue, populatedRatio);
            const finalValue = (isNaN(calculatedValue) || !isFinite(calculatedValue)) ? 0 : calculatedValue; // Store 0 for NaN/Infinity

            // Upsert using the repository method
            await this.evaluationRepository.upsert(
                userId, period.id, ratio.id,
                { value: finalValue, status: status, calculatedAt: new Date() }, // Update part
                { userId, periodId: period.id, ratioId: ratio.id, value: finalValue, status: status, calculatedAt: new Date() } // Create part
            );

            resultsDto.push({
                ratioId: ratio.id,
                ratioCode: ratio.code,
                ratioTitle: ratio.title,
                value: finalValue,
                status: status,
                idealRangeDisplay: this.getIdealRangeDisplay(ratio), // Helper for ideal text
            });
        }
        logger.info(`[EvaluationService] Calculated and stored ${resultsDto.length} evaluations for user ${userId}, period ${periodId}`);
        return resultsDto;
    }

    private getIdealRangeDisplay(ratio: Ratio): string | null {
        // Construct ideal text from bounds, e.g. ">= 15%", "3-6 months"
        // This logic can be expanded based on your RatioDef's idealText from Flutter
        if (ratio.code === "LIQUIDITY_RATIO") return "3-6 Bulan";
        if (ratio.lowerBound != null && ratio.upperBound != null) {
            return `${ratio.isLowerBoundInclusive ? '>=' : '>'} ${ratio.lowerBound}${ratio.multiplier === 100 ? '%' : ''} dan ${ratio.isUpperBoundInclusive ? '<=' : '<'} ${ratio.upperBound}${ratio.multiplier === 100 ? '%' : ''}`;
        }
        if (ratio.lowerBound != null) return `${ratio.isLowerBoundInclusive ? '>=' : '>'} ${ratio.lowerBound}${ratio.multiplier === 100 ? '%' : ''}`;
        if (ratio.upperBound != null) return `${ratio.isUpperBoundInclusive ? '<=' : '<'} ${ratio.upperBound}${ratio.multiplier === 100 ? '%' : ''}`;
        return ratio.title.includes("Solvabilitas") ? "> 0%" : "N/A"; // Fallback for solvency or no specific bounds
    }


    // PSPEC 4.4: Get Evaluation History
    async getEvaluationHistoryForUser(userId: string, startDate?: Date, endDate?: Date): Promise<PopulatedEvaluationResult[]> {
        // This fetches raw EvaluationResult records. Aggregation into "History" DTO
        // with counts (ideal, notIdeal) per period would happen here if backend is to summarize.
        // For now, returning raw populated results for the client to potentially summarize.
        const whereClause: Prisma.EvaluationResultWhereInput = { userId: userId };
        if (startDate && endDate) {
            // Filter by periods overlapping the date range
            const overlappingPeriods = await prisma.period.findMany({
                where: { userId, startDate: { lte: endDate }, endDate: { gte: startDate }, deletedAt: null },
                select: { id: true }
            });
            if (overlappingPeriods.length === 0) return [];
            whereClause.periodId = { in: overlappingPeriods.map(p => p.id) };
        }

        logger.info(`[EvaluationService] Fetching evaluation history for user ${userId}`);
        return this.evaluationRepository.findAllByUserId(userId, { where: whereClause, orderBy: { period: { startDate: 'desc' } } });
    }

    // PSPEC 4.3: Get Detailed Evaluation Result
    async getEvaluationDetailById(evaluationResultId: string, userId: string): Promise<EvaluationResultDetailDto> {
        const result = await this.evaluationRepository.findById(evaluationResultId);
        if (!result || result.userId !== userId) { // Check ownership via userId on EvaluationResult
            throw new NotFoundError(`Evaluation result with ID ${evaluationResultId} not found or access denied.`);
        }
        if (!result.ratio || !result.period) { // Should be populated by defaultInclude
            throw new AppError(`EvaluationResult ${evaluationResultId} is missing critical relation data.`, 500, false);
        }

        const populatedRatioFromResult = result.ratio as Ratio & { ratioComponents: (RatioComponent & { subcategory: Subcategory })[] };

        const transactionsInPeriod = await this.transactionService.getAllUserTransactions(userId, {
            startDate: result.period.startDate.toISOString(),
            endDate: result.period.endDate.toISOString(),
        });

        const conceptualSums = this.computeConceptualSumsForBreakdown(transactionsInPeriod);
        const breakdownComponentsDto: ConceptualComponentValueDto[] = [];
        // Map conceptualSums to human-readable names based on the specific ratio's formula (as in previous getEvaluationDetail)
        // ... (mapping logic from previous version, using populatedRatioFromResult.code) ...
        if (populatedRatioFromResult.code === "LIQUID_ASSETS_TO_NET_WORTH_RATIO") { /* ... */ } // etc. for all ratios

        let calcNum = 0, calcDen = 0; // Re-calculate raw num/den for display
        // ... (logic from previous version to calculate raw num/den based on populatedRatioFromResult.ratioComponents)

        return {
            ...result, // Spread PopulatedEvaluationResult
            breakdownComponents: breakdownComponentsDto,
            calculatedNumerator: calcNum,
            calculatedDenominator: calcDen,
        };
    }
}