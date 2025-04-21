// repositories/otpVerificationRepository.ts
import { OtpVerification, PrismaClient } from '@prisma/client';
import { BaseRepository } from './baseRepository';

export class OtpVerificationRepository extends BaseRepository<OtpVerification> {
    constructor(prisma: PrismaClient) {
        super(prisma, prisma.transaction);
    }

    // Add Transaction-specific methods if needed
}
