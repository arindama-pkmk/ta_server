// src/services/otpVerificationService.ts
/// import { OtpVerification } from '@prisma/client'; // Prisma model
import { OtpVerificationRepository } from '../repositories/otpVerificationRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import { sendEmail } from '../utils/emailHandler'; // Assuming this utility is well-defined
// import { getEmailContent } from '../utils/emailTemplateLoader'; // For email content
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';
import { BadRequestError } from '../utils/errorHandler'; // Using custom error
import prisma from '../config/database'; // For prisma.$transaction

@injectable()
export class OtpVerificationService {
    private readonly otpRepository: OtpVerificationRepository;

    constructor(@inject(TYPES.OtpVerificationRepository) otpRepository: OtpVerificationRepository) {
        this.otpRepository = otpRepository;
    }

    async generateAndSendOtp(email: string, userId?: string | null): Promise<void> {
        // Optional: Clean up any old, unverified OTPs for this email to prevent clutter
        // await this.otpRepository.deleteMany({ where: { email: email } });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiresAt = new Date(Date.now() + parseInt(loadEnvironmentVariable('OTP_EXPIRATION_TIME'))); // e.g., 10 minutes in ms

        const createData: any = {
            email,
            otp,
            expiresAt,
        };
        if (userId) {
            createData.user = { connect: { id: userId } };
        }
        await this.otpRepository.create(createData);

        const emailCategory = 'registrationotp'; // Or determine based on context (e.g., 'forgotpasswordotp')

        await sendEmail(email, emailCategory, { otp: otp });
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        // Wrap in transaction to ensure OTP is found and deleted atomically
        return prisma.$transaction(async (tx) => {
            // Need to use the transactional client 'tx' for Prisma operations here
            // This requires OtpVerificationRepository methods to optionally accept 'tx'
            // Or, perform the raw Prisma calls directly here within the transaction.
            // For simplicity, let's perform raw Prisma calls here.

            const otpRecord = await tx.otpVerification.findFirst({
                where: {
                    email,
                    otp,
                    expiresAt: { gte: new Date() },
                    deletedAt: null, // If OtpVerification has soft delete
                },
            });

            if (!otpRecord) {
                throw new BadRequestError('Invalid or expired OTP');
            }

            // OTP is valid, now invalidate it (hard delete)
            await tx.otpVerification.delete({
                where: { id: otpRecord.id },
            });

            return true;
        });
    }

    async cleanupExpiredOtps(): Promise<number> {
        const result = await this.otpRepository.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(), // Less than current time
                },
            },
        });
        return result.count;
    }
}