// prisma/seedAll.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const prisma = new PrismaClient();

// Define the order of seed scripts
const seedScriptsInOrder = [
    'seedOccupations.ts',
    'seedCategoriesAndSubcategories.ts',
    'seedUsers.ts',
    'seedCategoryOccupations.ts',
    'seedRatiosAndComponents.ts',
    'seedTransactionsAndPeriods.ts',
    'seedEvaluationResults.ts',
];

async function main() {
    console.log('Starting all seed scripts...');

    for (const scriptFile of seedScriptsInOrder) {
        console.log(`\n▶ Running seed script: ${scriptFile}`);
        try {
            const scriptPath = join(__dirname, scriptFile);
            execSync(`npx ts-node ${scriptPath}`, { stdio: 'inherit' });
            console.log(`✅ Successfully finished seed script: ${scriptFile}`);
        } catch (error) {
            console.error(`❌ Error running seed script ${scriptFile}:`); // Removed error object logging for brevity
            console.error('Stopping further seeding due to error.');
            process.exit(1);
        }
    }
}

main()
    .catch(e => {
        console.error('Overall seeding process encountered an error:', e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('\n✅ All seed scripts process completed.');
        await prisma.$disconnect();
    });