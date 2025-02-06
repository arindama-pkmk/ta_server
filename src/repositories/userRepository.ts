// repositories/userRepository.ts
import { PrismaClient, User } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';

@injectable()
export class UserRepository extends BaseRepository<User> {
    /**
     * Initializes a new instance of the UserRepository class with the specified
     * PrismaClient instance.
     *
     * @param {PrismaClient} prisma - The PrismaClient instance to use for database
     *   operations.
     */
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        super(prisma, prisma.user);
    }

    // Add User-specific methods if needed
}
