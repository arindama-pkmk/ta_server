// src/controllers/classifierController.ts
import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import { inject, injectable } from 'inversify';
import { ClassifierService, ClassifiedTransactionDetails } from '../services/classifierService';
import { TYPES } from '../utils/types';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler'; // For confidence threshold display logic
import { validateZod } from '../middlewares/validationMiddleware'; // For validation
import { z } from 'zod'; // For Zod schema

// Zod Schema for request validation
const classifySchema = z.object({
    text: z.string().min(1, "Transaction description text is required."),
});

@injectable()
export class ClassifierController {
    private readonly classifierService: ClassifierService;
    private readonly confidenceThreshold: number;


    constructor(@inject(TYPES.ClassifierService) classifierService: ClassifierService) {
        this.classifierService = classifierService;
        this.confidenceThreshold = parseFloat(loadEnvironmentVariable('ML_CONFIDENCE_THRESHOLD') || "0.5");
    }

    async classifyTransaction(req: Request, res: Response, next: NextFunction): Promise<void> { // Added next
        try {
            // Validation is now handled by middleware, req.body is considered validated
            const { text } = req.body;

            const classificationDetails = await this.classifierService.getClassifiedCategoryDetails(text);

            if (classificationDetails) {
                // If subcategoryId is present, it means ML predicted with high confidence AND it mapped to a DB entry
                if (classificationDetails.subcategoryId && classificationDetails.isKnownSubcategory) {
                    res.status(200).json({
                        success: true,
                        data: classificationDetails,
                    });
                }
                // If subcategoryName is present but no subcategoryId (or isKnownSubcategory is false)
                else if (classificationDetails.subcategoryName && !classificationDetails.isKnownSubcategory) {
                    if (classificationDetails.confidence < this.confidenceThreshold) {
                        res.status(200).json({
                            success: false, // Indicate that it's not a firm suggestion
                            message: `Confidence (${(classificationDetails.confidence * 100).toFixed(1)}%) too low for a reliable category.`,
                            data: { // Still provide what ML thought
                                predictedSubcategoryName: classificationDetails.subcategoryName,
                                confidence: classificationDetails.confidence,
                            }
                        });
                    } else {
                        res.status(200).json({
                            success: false, // Indicate that it's not a firm suggestion
                            message: `Predicted category "${classificationDetails.subcategoryName}" (Confidence: ${(classificationDetails.confidence * 100).toFixed(1)}%) is not a known system category.`,
                            data: {
                                predictedSubcategoryName: classificationDetails.subcategoryName,
                                confidence: classificationDetails.confidence,
                            }
                        });
                    }
                } else { // Should ideally not happen if service returns null/throws for other errors
                    res.status(200).json({
                        success: false,
                        message: 'Classification returned low confidence or no specific category.',
                        data: { confidence: classificationDetails.confidence }
                    });
                }
            } else {
                // This case means the service returned null, possibly due to an internal error
                // before calling the ML API, or if the ML API call itself failed fundamentally.
                // The service should throw AppError in such cases, which 'next(error)' handles.
                // If it *can* return null for "no classification possible", handle that.
                // For now, assuming service throws for critical failures.
                res.status(200).json({
                    success: false,
                    message: 'Could not obtain a classification for the provided description.',
                });
            }
        } catch (error) {
            next(error); // Pass to global error handler
        }
    }
}