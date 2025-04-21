// repositories/userRepository.ts
import { PrismaClient, User } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        super(prisma, prisma.user);
    }

    // Add User-specific methods if needed
}
