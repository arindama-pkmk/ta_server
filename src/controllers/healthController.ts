// src/controllers/healthController.ts
import { Request, Response, NextFunction } from 'express'; // Added NextFunction
import { injectable, inject } from 'inversify'; // Added inject
import { PrismaClient } from '@prisma/client';
import { TYPES } from '../utils/types'; // For PrismaClient injection
import logger from '../utils/logger'; // For logging
import { AppError } from '../utils/errorHandler'; // For consistent error handling

@injectable()
export class HealthController {
    private readonly prisma: PrismaClient;

    // Inject PrismaClient for consistency with other controllers/services
    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // getStatus is a bit redundant if getHealthStatus provides more detail.
    // Consider if both are needed. For now, keeping it.
    async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // A more lightweight check than $queryRaw might be to fetch a tiny amount of data
            // or rely on Prisma's internal connection state if available,
            // but $connect itself is a good indicator.
            // For a simple status, just ensuring the app is running is often enough.
            // The DB check is better placed in getHealthStatus.
            res.status(200).json({ status: 'OK', message: 'Application is running.' });
        } catch (error) {
            // This catch might not be hit if it's just a status response without DB interaction.
            logger.error('[HealthController] Error in getStatus (should not happen if no DB call):', error);
            next(new AppError('Failed to get application status.', 500, false));
        }
    }

    async getHealthStatus(_req: Request, res: Response, _next: NextFunction): Promise<void> {
        let dbHealthy = false;
        let dbErrorMessage: string | null = null;

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbHealthy = true;
        } catch (error) {
            dbHealthy = false;
            dbErrorMessage = (error instanceof Error) ? error.message : 'Unknown database connection error.';
            logger.error('[HealthController] Database health check failed:', error);
        }

        const healthResponse = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(), // Uptime in seconds
            services: {
                application: 'healthy', // App is running if this endpoint is hit
                database: {
                    status: dbHealthy ? 'connected' : 'disconnected',
                    message: dbHealthy ? 'Successfully connected to the database.' : dbErrorMessage,
                }
            },
            memoryUsage: process.memoryUsage(),
        };

        res.status(dbHealthy ? 200 : 503).json(healthResponse); // 503 Service Unavailable if DB is down
    }
}