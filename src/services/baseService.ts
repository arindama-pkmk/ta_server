// src/services/baseService.ts
import { BaseRepository } from '../repositories/baseRepository';

export class BaseService<T> {
    protected repository: BaseRepository<T>;

    constructor(repository: BaseRepository<T>) {
        this.repository = repository;
    }

    async create(item: T): Promise<T> {
        return this.repository.create(item);
    }

    async findAll(params?: { where?: any; orderBy?: any; skip?: number; take?: number }): Promise<T[]> {
        return this.repository.findAll(params);
    }

    async findById(id: string): Promise<T | null> {
        return this.repository.findById(id);
    }

    async update(id: string, item: Partial<T>): Promise<T> {
        return this.repository.update(id, item);
    }

    async delete(id: string): Promise<void> {
        return this.repository.delete(id);
    }
}
