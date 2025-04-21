import { App } from './app';
import { config } from 'dotenv';
import { connectDatabase } from './config/database';
import { loadEnvironmentVariable } from './utils/environmentVariableHandler';

config();

connectDatabase();

const appInstance = new App();
const app = appInstance.getApp();
const port = Number(loadEnvironmentVariable('PORT') ?? 4000);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

