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

    /**
     * Initializes a new instance of the App class.
     *
     * @remarks
     * This constructor initializes a new Express Application instance and
     * configures the middleware, helmet, and routes for the application.
     */
    constructor() {
        this.app = express();
        dotenv.config();
        this.configureMiddleware();
        this.configureHelmet();
        this.registerRoutes();
    }

    /**
     * Configures the middleware for the Express Application instance.
     *
     * This method enables CORS, JSON, and URL-encoded request body parsing.
     */
    private configureMiddleware(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    /**
     * Configures the Helmet security middleware for the Express Application instance.
     *
     * This method configures the Helmet middleware to enable security headers in
     * production mode. In development mode, it disables the security headers to
     * allow for easier debugging.
     */
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

    /**
     * Registers the routes for the application.
     *
     * This method registers the routes for the application by retrieving the
     * Routes instance from the IoC container and calling the register method on
     * it. The register method is expected to set up the routing for the
     * application.
     */
    private registerRoutes(): void {
        const routes = container.get<Routes>(TYPES.Routes);
        routes.register(this.app);
    }

    /**
     * Returns the Express Application instance.
     *
     * @returns {express.Application} The Express Application instance.
     */
    public getApp(): express.Application {
        return this.app;
    }
}
