// src/controllers/otpVerificationController.ts
import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import { OtpVerificationService } from '../services/otpVerificationService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
/// import { validateZod } from '../middlewares/validationMiddleware'; // Assuming you'll use this
/// import { requestOtpSchema, verifyOtpSchema } from '../validators/otpValidator'; // Create these Zod schemas

@injectable()
export class OtpVerificationController {
    private readonly otpService: OtpVerificationService;

    constructor(@inject(TYPES.OtpVerificationService) otpService: OtpVerificationService) {
        this.otpService = otpService;
    }

    async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validation should be done by middleware before this handler
            const { email, userId } = req.body; // userId is optional, for OTPs for existing users

            await this.otpService.generateAndSendOtp(email, userId);
            res.status(200).json({ success: true, message: "OTP sent successfully." });
        } catch (error) {
            next(error); // Pass to global error handler
        }
    }

    async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validation should be done by middleware
            const { email, otp } = req.body;

            await this.otpService.verifyOtp(email, otp); // verifyOtp now throws on failure
            res.status(200).json({ success: true, message: "OTP verified successfully." });
        } catch (error) {
            next(error); // Pass to global error handler
        }
    }
}