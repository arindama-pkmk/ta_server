// services/baseService.ts
import { BaseRepository } from '../repositories/baseRepository';

export class BaseService<T> {
    protected repository: BaseRepository<T>;

    /**
     * Initializes a new instance of the BaseService class with the specified BaseRepository.
     * @param {BaseRepository<T>} repository The BaseRepository that will be used to perform the operations.
     */
    constructor(repository: BaseRepository<T>) {
        this.repository = repository;
    }

    /**
     * Creates a new record in the database.
     *
     * @param item - The new record to be created.
     *
     * @returns {Promise<T>} A promise that resolves with the newly created record.
     */
    async create(item: T): Promise<T> {
        return this.repository.create(item);
    }

    /**
     * Retrieves all records from the repository.
     *
     * @returns {Promise<T[]>} A promise that resolves with an array of all records.
     */
    async findAll(): Promise<T[]> {
        return this.repository.findAll();
    }

    /**
     * Retrieves a record from the repository by its ID.
     *
     * @param id - The ID of the record to retrieve.
     *
     * @returns {Promise<T | null>} A promise that resolves with the record if found, or null if no record is found.
     */
    async findById(id: string): Promise<T | null> {
        return this.repository.findById(id);
    }

    /**
     * Updates a record in the repository.
     *
     * @param id - The ID of the record to update.
     * @param item - The partial record to update the existing record with.
     *
     * @returns {Promise<T>} A promise that resolves with the updated record.
     */
    async update(id: string, item: Partial<T>): Promise<T> {
        return this.repository.update(id, item);
    }

    async delete(id: string): Promise<void> {
        return this.repository.delete(id);
    }
}
