import 'reflect-metadata';
import { Container } from 'inversify';
import { UserService } from '../../src/services/userService';
import { UserRepository } from '../../src/repositories/userRepository';
import { TYPES } from '../../src/utils/types';
import { User } from '@prisma/client';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

jest.mock('../../src/repositories/userRepository');

describe('UserService', () => {
    let userService: UserService;
    let userRepository: UserRepository;

    beforeEach(() => {
        const container = new Container();
        container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
        container.bind<UserService>(TYPES.UserService).to(UserService);

        userRepository = container.get<UserRepository>(TYPES.UserRepository);
        userService = container.get<UserService>(TYPES.UserService);
    });

    describe('createUser', () => {
        it('should create a user', async () => {
            const userId = uuidv4();

            userRepository.create = jest.fn().mockResolvedValueOnce({
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'password',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const user = await userService.create({
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'password',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            expect(userRepository.create).toHaveBeenCalledWith({
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'password',
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });

            expect(validateUuid(user.id)).toBe(true);
            expect(user.name).toBe('Test User');
        });
    });

    describe('findUserByEmail', () => {
        it('should return a user if a matching email is found', async () => {
            const mockUsers: User[] = [
                { id: uuidv4(), name: 'Alice', email: 'alice@example.com', password: 'pass1', createdAt: new Date(), updatedAt: new Date() },
                { id: uuidv4(), name: 'Bob', email: 'bob@example.com', password: 'pass2', createdAt: new Date(), updatedAt: new Date() },
            ];

            userRepository.findAll = jest.fn().mockResolvedValueOnce(mockUsers);

            const result = await userService.findUserByEmail('bob@example.com');

            expect(userRepository.findAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockUsers[1]);
            expect(validateUuid(result!.id)).toBe(true);
        });

        it('should return null if no matching email is found', async () => {
            userRepository.findAll = jest.fn().mockResolvedValueOnce([]);

            const result = await userService.findUserByEmail('nonexistent@example.com');

            expect(userRepository.findAll).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });
    });
});
