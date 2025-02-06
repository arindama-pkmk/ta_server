// repositories/baseRepository.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
    protected prisma: PrismaClient;
    protected model: { create: Function; findMany: Function; findUnique: Function; findFirst: Function; update: Function; delete: Function };

    /**
     * Initializes the BaseRepository with a PrismaClient and a model.
     * 
     * @param prisma - The PrismaClient instance to use for database operations.
     * @param model - The Prisma model to use for database operations, given as an object
     *   with the following properties:
     *   - `create`: A function that creates a new record in the database.
     *   - `findMany`: A function that retrieves a list of records from the database.
     *   - `findUnique`: A function that retrieves a single record from the database
     *     based on a unique identifier.
     *   - `findFirst`: A function that retrieves the first record from the database
     *     that matches the given query.
     *   - `update`: A function that updates a record in the database.
     *   - `delete`: A function that deletes a record from the database.
     */
    constructor(prisma: PrismaClient, model: {
        create: Function;
        findMany: Function;
        findUnique: Function;
        findFirst: Function;
        update: Function;
        delete: Function;
    }) {
        this.prisma = prisma;
        this.model = model;
    }

    /**
     * Creates a new record in the database.
     *
     * @param data - Partial data for the new record.
     *
     * @returns {Promise<T>} A promise that resolves with the newly created record.
     */
    async create(data: Partial<T>): Promise<T> {
        return this.model.create({ data });
    }

    /**
     * Retrieves all records from the database.
     *
     * @returns {Promise<T[]>} A promise that resolves with an array of all records.
     */
    async findAll(): Promise<T[]> {
        return this.model.findMany();
    }

    /**
     * Retrieves a single record from the database by its ID.
     *
     * @param id - The ID of the record to retrieve.
     *
     * @returns {Promise<T | null>} A promise that resolves with the record if found, or null if no record is found.
     */
    async findById(id: string): Promise<T | null> {
        return this.model.findUnique({ where: { id } });
    }

    /**
     * Retrieves the first record from the database that matches the given query.
     *
     * @param query - The query object to pass to the underlying Prisma model's
     *   `findFirst` method.
     *
     * @returns {Promise<T | null>} A promise that resolves with the first record
     *   that matches the given query, or null if no records are found.
     */
    async findFirst(query: object): Promise<T | null> {
        return this.model.findFirst(query);
    }

    /**
     * Updates a record in the database.
     *
     * @param id - The ID of the record to update.
     * @param data - Partial data for the record to update.
     *
     * @returns {Promise<T>} A promise that resolves with the updated record.
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        return this.model.update({
            where: { id },
            data,
        });
    }

    /**
     * Deletes a record from the database by its ID.
     *
     * @param id - The ID of the record to delete.
     *
     * @returns {Promise<void>} A promise that resolves when the record has been deleted.
     */
    async delete(id: string): Promise<void> {
        await this.model.delete({ where: { id } });
    }
}
