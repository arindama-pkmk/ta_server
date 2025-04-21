// controllers/otpVerificationController.ts
import { OtpVerification } from '@prisma/client';
import { BaseController } from './baseController';
import { OtpVerificationService } from '../services/otpVerificationService';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';

@injectable()
export class OtpVerificationController extends BaseController<OtpVerification> {
    constructor(@inject(TYPES.OtpVerificationService) otpverificationService: OtpVerificationService) {
        super(otpverificationService);
    }

    // Add user-specific HTTP handlers here if needed
}
