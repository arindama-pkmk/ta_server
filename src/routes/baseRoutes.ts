// src/routes/baseRoutes.ts
import { RequestHandler, Router } from 'express';
import { BaseController } from '../controllers/baseController';

export class BaseRoutes<T> {
    protected router: Router;
    protected controller: BaseController<T>;

    constructor(controller: BaseController<T>, middlewares: RequestHandler[] = []) {
        this.router = Router();
        this.controller = controller;
        this.initializeRoutes(middlewares);
    }

    private initializeRoutes(middlewares: RequestHandler[]) {
        this.router.post('/', ...middlewares, this.controller.create.bind(this.controller));
        this.router.get('/', this.controller.findAll.bind(this.controller));
        this.router.get('/:id', this.controller.findById.bind(this.controller));
        this.router.put('/:id', ...middlewares, this.controller.update.bind(this.controller));
        this.router.delete('/:id', this.controller.delete.bind(this.controller));
    }

    public getRouter(): Router {
        return this.router;
    }
}
