// src/routes/baseRoutes.ts
import { RequestHandler, Router } from 'express';
import { BaseController } from '../controllers/baseController';

export class BaseRoutes<T> {
    protected router: Router;
    protected controller: BaseController<T>;

    /**
     * Initializes a new instance of the BaseRoutes class.
     *
     * @param {BaseController<T>} controller - The controller instance that handles the requests.
     * @param {RequestHandler[]} [middlewares=[]] - An optional array of middleware functions to apply to the routes.
     */
    constructor(controller: BaseController<T>, middlewares: RequestHandler[] = []) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes(middlewares);
    }

    /**
     * Initializes the routes for the controller.
     *
     * This method creates the routes for the controller based on the provided middleware functions.
     * It binds the controller methods to the Express router instance.
     *
     * @param {RequestHandler[]} middlewares - An array of middleware functions to apply to the routes.
     */
    private initializeRoutes(middlewares: RequestHandler[]) {
        this.router.post('/', ...middlewares, this.controller.create.bind(this.controller));
        this.router.get('/', this.controller.findAll.bind(this.controller));
        this.router.get('/:id', this.controller.findById.bind(this.controller));
        this.router.put('/:id', ...middlewares, this.controller.update.bind(this.controller));
        this.router.delete('/:id', this.controller.delete.bind(this.controller));
    }

    /**
     * Returns the Express Router instance that contains the routes for the controller.
     * 
     * @returns {Router} The Express Router instance containing the routes.
     */
    public getRouter(): Router {
        return this.router;
    }
}
