// prisma/seedAll.ts
import { PrismaClient } from '@prisma/client';
import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const prisma = new PrismaClient();

async function main() {
    const seedDir = __dirname;
    const me = basename(__filename); // e.g. 'seedAll.ts'

    const seedFiles = readdirSync(seedDir)
        // only files starting with 'seed' and ending in .ts/.js
        .filter(f => /^seed.*\.(ts|js)$/.test(f))
        // but skip the master script itself
        .filter(f => f !== me);

    for (const file of seedFiles) {
        console.log(`▶ running seed script ${file}`);
        await import(join(seedDir, file));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('✅ All seed scripts completed');
        await prisma.$disconnect();
    });
