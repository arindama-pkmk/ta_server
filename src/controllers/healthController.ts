import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';

@injectable()
export class HealthController {
    private readonly prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getStatus(_req: Request, res: Response) {
        try {
            await this.prisma.$connect();
            res.status(200).json({ status: 'OK' });
        } catch (error) {
            res.status(500).json({ status: 'Error', message: (error as Error).message });
        }
    }

    async getHealthStatus(_req: Request, res: Response) {
        let dbStatus: boolean | null = null;

        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbStatus = true;
        } catch (error) {
            dbStatus = false;
        }

        return res.status(dbStatus ? 200 : 500).json({
            status: dbStatus ? 'healthy' : 'unhealthy',
            services: {
                database: dbStatus,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString(),
            },
        });
    }
}
