import app from './app';
import { config } from 'dotenv';
import { connectDatabase } from './config/database';
import { loadEnvironmentVariable } from './utils/environmentVariableHandler';

config();

connectDatabase();

const port = loadEnvironmentVariable('PORT') ?? 4000;

/**
 * Starts the server and listens for incoming connections.
 *
 * @param port - The port number on which the server should listen for incoming connections.
 * If the PORT environment variable is not set, the server will listen on port 4000 by default.
 *
 * @returns - This function does not return a value. It starts the server and logs a message
 * indicating that the server is running on the specified port.
 */
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

