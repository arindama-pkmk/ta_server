// repositories/otpVerificationRepository.ts
import { PrismaClient, OtpVerification } from '@prisma/client';
import { BaseRepository } from './baseRepository';

export class OtpVerificationRepository extends BaseRepository<OtpVerification> {
    /**
     * Initializes a new instance of the OtpVerificationRepository class with the specified PrismaClient
     * instance.
     *
     * @param {PrismaClient} prisma - The PrismaClient instance to use for database operations.
     */
    constructor(prisma: PrismaClient) {
        super(prisma, prisma.transaction);
    }

    // Add Transaction-specific methods if needed
}
