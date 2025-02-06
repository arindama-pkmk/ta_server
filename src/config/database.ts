import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Connects to the database using the Prisma client.
 *
 * @returns A promise that resolves when the connection is successfully established.
 *
 * @remarks
 * This function attempts to establish a connection to the database using the Prisma client.
 * If the connection is successful, a message is logged to the console. If the connection fails,
 * an error is logged and the process exits with a status code of 1.
 */
export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }
};

export default prisma;
