// services/userService.ts
import { User } from '@prisma/client';
import { BaseService } from './baseService';
import { UserRepository } from '../repositories/userRepository';
import { TYPES } from '../utils/types';
import { inject, injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';

@injectable()
export class UserService extends BaseService<User> {
    constructor(@inject(TYPES.UserRepository) userRepository: UserRepository) {
        super(userRepository);
    }

    async findUserByIdentifier(identifier: string): Promise<User | null> {
        if (identifier.includes('@')) {
            return this.repository.findFirst({ where: { email: identifier } });
        }

        // if (/^\+?\d{7,15}$/.test(identifier)) {
        //     return this.repository.findFirst({ where: { phone: identifier } });
        // }

        return this.repository.findFirst({ where: { username: identifier } });
    }

    async checkUserExists(identifier: string): Promise<boolean> {
        const user = await this.findUserByIdentifier(identifier);
        return !!user;
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, loadEnvironmentVariable('SALT_ROUNDS'));
    }

    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    async createVerifiedUser(userData: Partial<User>): Promise<User> {
        if (!userData.email || !userData.password) {
            throw new Error("Email and password are required");
        }
        const hashedPassword = await this.hashPassword(userData.password);
        return this.repository.create({ ...userData, password: hashedPassword } as User);
    }

    generateToken(id: string, email: string): string {
        return jwt.sign({ id, email }, loadEnvironmentVariable('JWT_SECRET'), { expiresIn: Number(loadEnvironmentVariable('JWT_EXPIRATION_TIME')) });
    }
}
