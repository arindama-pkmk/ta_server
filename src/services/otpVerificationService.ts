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
    /**
     * Initializes a new instance of the OtpVerificationService class with the specified OtpVerificationRepository.
     *
     * @param {OtpVerificationRepository} otpverificationRepository - The OtpVerificationRepository that will be used
     *   to perform the operations.
     */
    constructor(@inject(TYPES.OtpVerificationRepository) otpverificationRepository: OtpVerificationRepository) {
        super(otpverificationRepository);
    }

    /**
     * Generates a random 6-digit OTP and sends it to the specified email. The OTP is stored in the database
     * with the specified email and an expiration date that is set according to the OTP_EXPIRATION_TIME environment
     * variable.
     *
     * @param {string} email - The email address to which the OTP should be sent.
     */
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

    /**
     * Verifies that the given OTP is valid for the specified email address and has not expired.
     *
     * @param {string} email - The email address to verify the OTP against.
     * @param {string} otp - The OTP to verify.
     *
     * @returns {Promise<boolean>} A promise that resolves with a boolean indicating
     *   whether the OTP is valid or not.
     *
     * @throws {Error} If the OTP is invalid or expired.
     */
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
