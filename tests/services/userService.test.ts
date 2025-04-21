import { User } from '@prisma/client';
import { Container } from 'inversify';
import 'reflect-metadata';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { UserRepository } from '../../src/repositories/userRepository';
import { UserService } from '../../src/services/userService';
import { TYPES } from '../../src/utils/types';
import * as envUtils from '../../src/utils/environmentVariableHandler';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/repositories/userRepository');

describe('UserService', () => {
    let userService: UserService;
    let userRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        const container = new Container();
        userRepository = {
            create: jest.fn(),
            findFirst: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as Partial<UserRepository> as jest.Mocked<UserRepository>; // Cast to Partial first
        container.bind<UserRepository>(TYPES.UserRepository).toConstantValue(userRepository);
        container.bind<UserService>(TYPES.UserService).to(UserService);

        userService = container.get<UserService>(TYPES.UserService);

        jest.spyOn(envUtils, 'loadEnvironmentVariable').mockImplementation((key: string) => {
            const envMap: Record<string, string> = {
                SALT_ROUNDS: '10',
                JWT_SECRET: 'secret',
                JWT_EXPIRATION_TIME: '3600'
            };
            return envMap[key] ?? '';
        });
    });

    describe('createVerifiedUser', () => {
        it('should hash password and create user', async () => {
            const userId = uuidv4();
            const hashedPassword = 'hashedPassword123';
            const userData = {
                email: 'user@example.com',
                password: 'plainPassword',
            };

            (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

            userRepository.create.mockResolvedValueOnce({
                id: userId,
                email: userData.email,
                password: hashedPassword,
                name: 'Name',
                username: 'username',
                phone: '12345678',
                occupation: 'Dev',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const createdUser = await userService.createVerifiedUser(userData);

            expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', '10');
            expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                email: userData.email,
                password: hashedPassword,
            }));
            expect(validateUuid(createdUser.id)).toBe(true);
        });

        it('should throw error if email or password is missing', async () => {
            await expect(userService.createVerifiedUser({ email: '' }))
                .rejects.toThrow('Email and password are required');
        });
    });

    describe('findUserByIdentifier', () => {
        it('should find user by email', async () => {
            const identifier = 'email@example.com';
            const mockUser = { id: uuidv4(), email: identifier } as User;

            userRepository.findFirst.mockResolvedValueOnce(mockUser);
            const result = await userService.findUserByIdentifier(identifier);

            expect(userRepository.findFirst).toHaveBeenCalledWith({ where: { email: identifier } });
            expect(result).toEqual(mockUser);
        });

        it('should find user by phone', async () => {
            const identifier = '+6281234567890';
            const mockUser = { id: uuidv4(), phone: identifier } as User;

            userRepository.findFirst.mockResolvedValueOnce(mockUser);
            const result = await userService.findUserByIdentifier(identifier);

            expect(userRepository.findFirst).toHaveBeenCalledWith({ where: { phone: identifier } });
            expect(result).toEqual(mockUser);
        });

        it('should find user by username', async () => {
            const identifier = 'username123';
            const mockUser = { id: uuidv4(), username: identifier } as User;

            userRepository.findFirst.mockResolvedValueOnce(mockUser);
            const result = await userService.findUserByIdentifier(identifier);

            expect(userRepository.findFirst).toHaveBeenCalledWith({ where: { username: identifier } });
            expect(result).toEqual(mockUser);
        });
    });

    describe('checkUserExists', () => {
        it('should return true if user exists', async () => {
            userService.findUserByIdentifier = jest.fn().mockResolvedValueOnce({ id: uuidv4() } as User);
            const exists = await userService.checkUserExists('someone@example.com');
            expect(exists).toBe(true);
        });

        it('should return false if user does not exist', async () => {
            userService.findUserByIdentifier = jest.fn().mockResolvedValueOnce(null);
            const exists = await userService.checkUserExists('someone@example.com');
            expect(exists).toBe(false);
        });
    });

    describe('comparePassword', () => {
        it('should compare and return true if match', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
            const match = await userService.comparePassword('plain', 'hashed');
            expect(match).toBe(true);
        });

        it('should compare and return false if no match', async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
            const match = await userService.comparePassword('plain', 'wrong');
            expect(match).toBe(false);
        });
    });

    describe('generateToken', () => {
        it('should generate a JWT token', () => {
            const mockToken = 'jwt_token';
            (jwt.sign as jest.Mock).mockReturnValueOnce(mockToken);

            const token = userService.generateToken('user123', 'email@example.com');

            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'user123', email: 'email@example.com' },
                'secret',
                { expiresIn: 3600 }
            );
            expect(token).toBe(mockToken);
        });
    });
});
