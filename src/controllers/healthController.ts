import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';

@injectable()
export class HealthController {
    private readonly prisma: PrismaClient;

    /**
     * Initializes the HealthController with a new PrismaClient instance.
     */
    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Handles the "/status" endpoint and returns the current status of the server as
     * a simple JSON response.
     *
     * @param _req - The request object is not used.
     * @param res - The response object used to send the status.
     *
     * @returns {Promise<void>} - A promise that resolves when the status is sent in
     *   the response.
     *
     * This method attempts to connect to the database using a simple query. If the
     * query is successful, a JSON response with the status "OK" is sent. If the query
     * fails, a JSON response with the status "Error" is sent, along with the error
     * message from the database.
     */
    async getStatus(_req: Request, res: Response) {
        try {
            await this.prisma.$connect();
            res.status(200).json({ status: 'OK' });
        } catch (error) {
            res.status(500).json({ status: 'Error', message: (error as Error).message });
        }
    }

    /**
     * Handles the "/health" endpoint and returns the current health status of the
     * server and its services.
     *
     * @param _req - The request object is not used.
     * @param res - The response object used to send the health status.
     *
     * @returns {Promise<void>} - A promise that resolves when the health status is
     *   sent in the response.
     *
     * This method attempts to connect to the database using a simple query. If the
     * query is successful, the server is considered "healthy" and a JSON response
     * with the status "healthy" is sent. If the query fails, the server is
     * considered "unhealthy" and a JSON response with the status "unhealthy" is
     * sent.
     *
     * The JSON response contains the following information:
     *
     *   - `status`: The overall status of the server, either "healthy" or "unhealthy".
     *   - `services`: An object containing the status of individual services, such as
     *     the database.
     *   - `services.database`: The status of the database connection, either
     *     `true` or `false`.
     *   - `services.uptime`: The uptime of the server process in seconds.
     *   - `services.memoryUsage`: The memory usage of the server process, given as an
     *     object with the following properties:
     *     - `rss`: The resident set size of the process in bytes.
     *     - `heapTotal`: The total size of the V8 heap in bytes.
     *     - `heapUsed`: The total size of the V8 heap in use in bytes.
     *     - `external`: The total size of external memory in bytes.
     *   - `services.timestamp`: The current timestamp of the server in ISO 8601
     *     format.
     */
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
