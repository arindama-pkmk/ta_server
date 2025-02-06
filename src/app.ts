import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { container } from './utils/container';
import { Routes } from './routes';
import { TYPES } from './utils/types';
import helmet from 'helmet';
import { loadEnvironmentVariable } from './utils/environmentVariableHandler';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parse incoming JSON data
app.use(bodyParser.urlencoded({ extended: true })); // For handling URL encoded data

// Helmet Configuration Based on Environment
if (loadEnvironmentVariable('NODE_ENV') === 'production') {
    app.use(helmet());  // Enable all default security headers in production
    app.use(
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
    app.use(helmet.hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    }));
} else {
    app.use(helmet({
        contentSecurityPolicy: false,  // Disable CSP for local dev
        frameguard: false,  // Allow iframe embedding in local dev
        hsts: false,  // Disable HSTS in dev
    }));
}

// Routes
const routes = container.get<Routes>(TYPES.Routes);
routes.register(app);

export default app;
