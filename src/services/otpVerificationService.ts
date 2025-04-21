// services/otpverificationService.ts
import { OtpVerification } from '@prisma/client';
import { BaseService } from './baseService';
import { OtpVerificationRepository } from '../repositories/otpVerificationRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { sendEmail } from '../utils/emailHandler';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';

@injectable()
export class OtpVerificationService extends BaseService<OtpVerification> {
    constructor(@inject(TYPES.OtpVerificationRepository) otpverificationRepository: OtpVerificationRepository) {
        super(otpverificationRepository);
    }

    async generateAndSendOtp(email: string): Promise<void> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.repository.create({
            email,
            otp,
            expiresAt: new Date(Date.now() + Number(loadEnvironmentVariable('OTP_EXPIRATION_TIME'))),
        });

        await sendEmail(
            email,
            'otpverification',
        );
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        const otpRecord = await this.repository.findFirst({
            where: {
                email,
                otp,
                expiresAt: {
                    gte: new Date(),
                },
            },
        });

        if (!otpRecord) {
            throw new Error('Invalid or expired OTP');
        }

        await this.repository.delete(otpRecord.id);

        return true;
    }
}
