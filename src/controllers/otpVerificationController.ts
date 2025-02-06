// controllers/otpVerificationController.ts
import { OtpVerification } from '@prisma/client';
import { BaseController } from './baseController';
import { OtpVerificationService } from '../services/otpVerificationService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

@injectable()
export class OtpVerificationController extends BaseController<OtpVerification> {
    /**
     * Initializes a new instance of the OtpVerificationController class with the specified OtpVerificationService.
     *
     * @param {OtpVerificationService} otpverificationService - The OtpVerificationService used to handle OTP verification operations.
     */
    constructor(@inject(TYPES.OtpVerificationService) otpverificationService: OtpVerificationService) {
        super(otpverificationService);
    }

    // Add user-specific HTTP handlers here if needed
}
