import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    await prisma.evaluationResult.deleteMany({});
    await prisma.expenseAllocation.deleteMany({});
    await prisma.budgetPlan.deleteMany({});
    await prisma.transaction.deleteMany({});
    console.log('Relevant tables cleared.');
}
main().catch(console.error).finally(() => prisma.$disconnect());