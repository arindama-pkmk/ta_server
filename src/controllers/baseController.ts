import { Request, Response } from 'express';
import { BaseService } from '../services/baseService';

export class BaseController<T> {
    protected service: BaseService<T>;

    /**
     * Initializes a new instance of the BaseController class with the specified BaseService.
     * @param {BaseService<T>} service The BaseService that will be used to perform the operations.
     */
    constructor(service: BaseService<T>) {
        this.service = service;
    }

    /**
     * Handles the creation of a new resource.
     *
     * @param {Request} req - The request object containing the data for the new resource.
     * @param {Response} res - The response object used to send the result of the creation operation.
     *
     * @returns {Promise<void>} - A promise that resolves when the resource is created and the response is sent.
     *
     * This method attempts to create a new resource using the data provided in the request body.
     * If successful, it responds with a JSON representation of the created resource and a 201 status code.
     * If an error occurs during the creation process, a 400 status code is sent along with the error message.
     */
    async create(req: Request, res: Response): Promise<void> {
        try {
            const item = await this.service.create(req.body);
            res.status(201).json(item);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }

    /**
     * Retrieves all resources.
     *
     * @param {Request} _req - The request object is not used.
     * @param {Response} res - The response object used to send the result of the retrieval operation.
     *
     * @returns {Promise<void>} - A promise that resolves when the resources are retrieved and the response is sent.
     *
     * This method attempts to retrieve all resources.
     * If successful, it responds with a JSON representation of the retrieved resources.
     * If an error occurs during the retrieval process, a 400 status code is sent along with the error message.
     */
    async findAll(_req: Request, res: Response): Promise<void> {
        try {
            const items = await this.service.findAll();
            res.json(items);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ message: err.message });
        }
    }

    /**
     * Retrieves a resource by ID.
     *
     * @param {Request} req - The request object containing the ID parameter.
     * @param {Response} res - The response object used to send the result of the retrieval operation.
     *
     * @returns {Promise<void>} - A promise that resolves when the resource is retrieved and the response is sent.
     *
     * This method attempts to retrieve a resource using the ID provided in the request parameters.
     * If successful, it responds with a JSON representation of the retrieved resource.
     * If the resource is not found, a 404 status code is sent along with a message indicating that the item was not found.
     * If an error occurs during the retrieval process, a 400 status code is sent along with the error message.
     */
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

    /**
     * Updates a resource by ID.
     *
     * @param {Request} req - The request object containing the ID parameter and the data to update the resource.
     * @param {Response} res - The response object used to send the result of the update operation.
     *
     * @returns {Promise<void>} - A promise that resolves when the resource is updated and the response is sent.
     *
     * This method attempts to update a resource using the ID provided in the request parameters and the data provided in the request body.
     * If successful, it responds with a JSON representation of the updated resource.
     * If the resource is not found, a 404 status code is sent along with a message indicating that the item was not found.
     * If an error occurs during the update process, a 400 status code is sent along with the error message.
     */
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

    /**
     * Deletes a resource by ID.
     *
     * @param {Request} req - The request object containing the ID parameter.
     * @param {Response} res - The response object used to send the result of the delete operation.
     *
     * @returns {Promise<void>} - A promise that resolves when the resource is deleted and the response is sent.
     *
     * This method attempts to delete a resource using the ID provided in the request parameters.
     * If successful, it sends a 204 status code indicating that the resource was deleted.
     * If the ID parameter is missing, a 400 status code is sent along with a message indicating that the ID is required.
     * If an error occurs during the delete process, a 400 status code is sent along with the error message.
     */
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
