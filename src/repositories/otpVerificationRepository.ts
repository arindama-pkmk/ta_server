// src/repositories/otpVerificationRepository.ts
import { OtpVerification, PrismaClient, Prisma } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class OtpVerificationRepository {
    private readonly prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: Prisma.OtpVerificationCreateInput): Promise<OtpVerification> {
        return this.prisma.otpVerification.create({ data });
    }

    async findFirst(args: Prisma.OtpVerificationFindFirstArgs): Promise<OtpVerification | null> {
        // Ensure soft-deleted are excluded by default if applicable to OTPs
        // For OTPs, usually hard delete or let them expire, so deletedAt might not be on OtpVerification.
        // If your OtpVerification model *does* have deletedAt:
        const whereWithActive = { ...(args.where || {}), deletedAt: null };
        return this.prisma.otpVerification.findFirst({ ...args, where: whereWithActive });
        /// return this.prisma.otpVerification.findFirst(args);
    }

    async findActiveOtpByEmailAndOtp(email: string, otp: string): Promise<OtpVerification | null> {
        return this.prisma.otpVerification.findFirst({
            where: {
                email,
                otp,
                expiresAt: {
                    gte: new Date(), // Check if not expired
                },
                // deletedAt: null, // Only if OtpVerification has soft delete
            },
        });
    }

    async delete(id: string): Promise<OtpVerification> {
        // For OTPs, hard delete is common once verified or expired.
        return this.prisma.otpVerification.delete({
            where: { id },
        });
    }

    async deleteMany(args: Prisma.OtpVerificationDeleteManyArgs): Promise<Prisma.BatchPayload> {
        // Useful for cleaning up expired OTPs
        return this.prisma.otpVerification.deleteMany(args);
    }

    // If you were to use soft delete for OTPs (less common)
    async markAsUsed(id: string): Promise<OtpVerification> {
        return this.prisma.otpVerification.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}