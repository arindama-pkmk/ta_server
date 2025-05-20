// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import { container } from './utils/container';
import { Routes } from './routes';
import { TYPES } from './utils/types';
import { loadEnvironmentVariable } from './utils/environmentVariableHandler';

// Swagger imports
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerDefinition from './swaggerDef'; // Your swagger definition

export class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        dotenv.config();
        this.configureMiddleware();
        this.configureHelmet();
        this.configureSwagger(); // Add this
        this.registerRoutes();
    }

    private configureMiddleware(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
    }

    private configureHelmet(): void {
        // ... (helmet configuration remains the same)
        if (loadEnvironmentVariable('NODE_ENV') === 'production') {
            this.app.use(helmet());
            this.app.use(
                helmet.contentSecurityPolicy({
                    directives: {
                        defaultSrc: ["'self'"],
                        scriptSrc: ["'self'", "'unsafe-inline'",
                            // Add these for swagger-ui if CSP is active in dev/staging for docs
                            // swagger-ui uses inline scripts and styles
                            'https://cdn.jsdelivr.net', // Example for swagger cdn
                            "'unsafe-eval'"], // swagger-ui might need this
                        objectSrc: ["'none'"],
                        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
                        imgSrc: ["'self'", "data:", 'https://cdn.jsdelivr.net'], // For swagger images
                        fontSrc: ["'self'", 'https://fonts.gstatic.com'], // If swagger uses google fonts
                        connectSrc: ["'self'"], // Add your API itself
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
                    contentSecurityPolicy: false, // Allow Swagger UI to work easily in dev
                    frameguard: false,
                    hsts: false,
                })
            );
        }
    }

    private configureSwagger(): void {
        const options = {
            swaggerDefinition,
            // Paths to files containing OpenAPI definitions (glob patterns)
            apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/routes/index.ts'], // Ensure all files with JSDoc are included
        };
        const swaggerSpec = swaggerJSDoc(options);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        console.log(`Swagger UI available at /api-docs`);
    }


    private registerRoutes(): void {
        const routes = container.get<Routes>(TYPES.Routes);
        routes.register(this.app);
    }

    public getApp(): express.Application {
        return this.app;
    }
}