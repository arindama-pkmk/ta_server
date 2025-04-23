// src/controllers/baseController.ts
import { Request, Response } from 'express';
import { BaseService } from '../services/baseService';

export class BaseController<T> {
    protected service: BaseService<T>;

    constructor(service: BaseService<T>) {
        this.service = service;
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const item = await this.service.create(req.body);
            res.status(201).json(item);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }

    async findAll(_req: Request, res: Response): Promise<void> {
        try {
            const items = await this.service.findAll();
            res.json(items);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }

    async findById(req: Request, res: Response): Promise<void> {
        const id = req.params['id'];
        if (!id) {
            res.status(400).json({ message: 'ID parameter is required' });
            return;
        }

        try {
            const item = await this.service.findById(id);
            if (item) {
                res.json(item);
            } else {
                res.status(404).json({ message: 'Item not found' });
            }
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        const id = req.params['id'];
        if (!id) {
            res.status(400).json({ message: 'ID parameter is required' });
            return;
        }

        try {
            const item = await this.service.update(id, req.body);
            res.json(item);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        const id = req.params['id'];
        if (!id) {
            res.status(400).json({ message: 'ID parameter is required' });
            return;
        }

        try {
            await this.service.delete(id);
            res.sendStatus(204);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }
}
