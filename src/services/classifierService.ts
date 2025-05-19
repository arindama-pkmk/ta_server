// src/services/classifierService.ts
import axios, { isAxiosError } from 'axios';
import { injectable } from 'inversify'; // Added inject for consistency, though not strictly needed if no deps for constructor
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';
import prisma from '../config/database'; // For resolving label to full subcategory object
import { Subcategory, Category, AccountType } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, BadRequestError } from '../utils/errorHandler';

// DTO for the structured response from this service to its controller
export interface ClassifiedTransactionDetails {
    subcategoryId?: string;
    subcategoryName: string; // Can be the raw predicted_label if not found in DB
    categoryId?: string;
    categoryName?: string;
    accountTypeId?: string;
    accountTypeName?: string;
    confidence: number;
    isKnownSubcategory: boolean; // Flag to indicate if predicted_label matched a DB subcategory
}

@injectable()
export class ClassifierService {
    private readonly pythonApiUrl: string;
    private readonly confidenceThreshold: number;
    // No PrismaClient needs to be injected if using global prisma instance, but good practice if you switch later.
    // For findSubcategoryDetailsByName, it uses the global prisma instance from '../config/database'.

    constructor() {
        this.pythonApiUrl = loadEnvironmentVariable('PYTHON_ML_API_URL');
        this.confidenceThreshold = parseFloat(loadEnvironmentVariable('ML_CONFIDENCE_THRESHOLD')) ?? 0.5;
    }

    private async findSubcategoryDetailsByName(name: string): Promise<(Subcategory & { category: Category & { accountType: AccountType } }) | null> {
        // Ensure consistent casing or use Prisma's case-insensitive mode if DB supports/configured
        return prisma.subcategory.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' } // Example: case-insensitive search
            },
            include: {
                category: {
                    include: {
                        accountType: true
                    }
                }
            }
        });
    }

    async getClassifiedCategoryDetails(description: string): Promise<ClassifiedTransactionDetails | null> {
        if (!description || description.trim() === '') {
            // No description, no classification, but not an error.
            // Controller should handle this by not calling if text is empty.
            // Or throw BadRequestError if service expects non-empty.
            throw new BadRequestError("Description cannot be empty for classification.");
        }

        try {
            logger.info(`[ClassifierService] Requesting classification for description: "${description}"`);
            const response = await axios.post<{ predicted_label: string; confidence: number }>(
                `${this.pythonApiUrl}/predict`,
                { text: description },
                { timeout: parseInt(loadEnvironmentVariable('ML_API_TIMEOUT_MS') || '5000') } // Add timeout
            );

            const mlResponse = response.data;
            logger.info(`[ClassifierService] ML API Response: ${JSON.stringify(mlResponse)}`);


            if (mlResponse && typeof mlResponse.predicted_label === 'string' && typeof mlResponse.confidence === 'number') {
                if (mlResponse.confidence < this.confidenceThreshold) {
                    logger.info(`[ClassifierService] Confidence ${mlResponse.confidence} below threshold ${this.confidenceThreshold} for "${mlResponse.predicted_label}".`);
                    return {
                        subcategoryName: mlResponse.predicted_label, // Still return the low-confidence label
                        confidence: mlResponse.confidence,
                        isKnownSubcategory: false, // Explicitly false
                    };
                }

                const subcategoryDetails = await this.findSubcategoryDetailsByName(mlResponse.predicted_label);

                if (subcategoryDetails) {
                    logger.info(`[ClassifierService] Mapped ML label "${mlResponse.predicted_label}" to Subcategory ID: ${subcategoryDetails.id}`);
                    return {
                        subcategoryId: subcategoryDetails.id,
                        subcategoryName: subcategoryDetails.name, // Use name from DB for consistency
                        categoryId: subcategoryDetails.categoryId,
                        categoryName: subcategoryDetails.category.name,
                        accountTypeId: subcategoryDetails.category.accountTypeId,
                        accountTypeName: subcategoryDetails.category.accountType.name,
                        confidence: mlResponse.confidence,
                        isKnownSubcategory: true,
                    };
                } else {
                    logger.warn(`[ClassifierService] ML predicted subcategory "${mlResponse.predicted_label}" (confidence: ${mlResponse.confidence}) not found in DB.`);
                    return {
                        subcategoryName: mlResponse.predicted_label, // Raw label from ML
                        confidence: mlResponse.confidence,
                        isKnownSubcategory: false,
                    };
                }
            }
            logger.warn('[ClassifierService] Invalid response format from ML API:', { mlResponse });
            // This indicates a problem with the ML service's response contract
            throw new AppError('Received invalid response format from classification service.', 502, false); // 502 Bad Gateway
        } catch (error) {
            if (isAxiosError(error)) {
                const axiosError = error;
                logger.error(
                    `[ClassifierService] Axios error during classification: ${axiosError.message}`,
                    {
                        status: axiosError.response?.status,
                        data: axiosError.response?.data,
                    }
                );
                if (axiosError.response) {
                    throw new AppError(
                        `Classification service request failed with status ${axiosError.response.status}.`,
                        axiosError.response.status,
                        false
                    );
                } else if (axiosError.request) {
                    // Network error, timeout
                    throw new AppError(
                        "Classification service is unreachable or timed out.",
                        503,
                        false
                    ); // 503 Service Unavailable
                }
            }
            logger.error('[ClassifierService] Unexpected error classifying transaction description:', error);
            // Re-throw as a generic AppError if it's not already one of ours
            if (error instanceof AppError) throw error;
            throw new AppError('An unexpected error occurred during transaction classification.', 500, false);
        }
    }
}