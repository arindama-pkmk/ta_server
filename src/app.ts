import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import { container } from './utils/container';
import { Routes } from './routes';
import { TYPES } from './utils/types';
import { loadEnvironmentVariable } from './utils/environmentVariableHandler';

export class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        dotenv.config();
        this.configureMiddleware();
        this.configureHelmet();
        this.registerRoutes();
    }

    private configureMiddleware(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    private configureHelmet(): void {
        if (loadEnvironmentVariable('NODE_ENV') === 'production') {
            this.app.use(helmet());
            this.app.use(
                helmet.contentSecurityPolicy({
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'"],
                        objectSrc: ["'none'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", "data:"],
                        fontSrc: ["'self'"],
                        connectSrc: ["'self'"],
                        upgradeInsecureRequests: [],
                    },
                })
            );
            this.app.use(
                helmet.hsts({
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true,
                })
            );
        } else {
            this.app.use(
                helmet({
                    contentSecurityPolicy: false,
                    frameguard: false,
                    hsts: false,
                })
            );
        }
    }

    private registerRoutes(): void {
        const routes = container.get<Routes>(TYPES.Routes);
        routes.register(this.app);
    }

    public getApp(): express.Application {
        return this.app;
    }
}
