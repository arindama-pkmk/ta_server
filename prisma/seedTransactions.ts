import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, addMilliseconds } from 'date-fns';
import bcrypt from 'bcryptjs';
import { loadEnvironmentVariable } from '../src/utils/environmentVariableHandler';

const prisma = new PrismaClient();
const saltRounds = Number(loadEnvironmentVariable('SALT_ROUNDS'));

interface UserSeed {
    name: string;
    username: string;
    email: string;
    address: string;
    birthdate: Date;
    password: string;
    occupationName: string;
}

const userData: UserSeed[] = [
    { name: 'Muchamad Diaz Adhari', username: 'muchamad_diaz', email: 'diaz.adhariseed@example.com', address: 'Kota Bandung', birthdate: new Date('2003-02-23'), password: 'changeme', occupationName: 'Karyawan Muda' },
    { name: 'Bilsen Natan Sius', username: 'bilsen_sius', email: 'bilsen.sius@example.com', address: 'Kota Cimahi', birthdate: new Date('2007-01-22'), password: 'changeme', occupationName: 'Pelajar' },
    { name: 'Aura', username: 'aura_seed', email: 'aura.seed@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2007-06-02'), password: 'changeme', occupationName: 'Pelajar' },
    { name: 'Ikhsan Muhammad Fajar', username: 'ikhsan_fajar', email: 'ikhsan.fajar@example.com', address: 'Kabupaten Sumedang', birthdate: new Date('2003-09-19'), password: 'changeme', occupationName: 'Mahasiswa' },
    { name: 'Fariz', username: 'fariz_seed', email: 'fariz.seed@example.com', address: 'Kabupaten Bandung Barat', birthdate: new Date('2003-02-12'), password: 'changeme', occupationName: 'Karyawan Muda' },
    { name: 'Wulan Agustina', username: 'wulan_agustina', email: 'wulan.agustina@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2007-08-17'), password: 'changeme', occupationName: 'Pelajar' },
    { name: 'Reni Apriani', username: 'reni_apriani', email: 'reni.apriani@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2004-04-28'), password: 'changeme', occupationName: 'Mahasiswa' },
    { name: 'Rindi Afriani', username: 'rindi_afriani', email: 'rindi.afriani@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2004-08-29'), password: 'changeme', occupationName: 'Mahasiswa' },
    { name: 'Reqi Jumantara', username: 'reqi_jumantara', email: 'reqi.jumantara@example.com', address: 'Bandung', birthdate: new Date('2005-04-23'), password: 'changeme', occupationName: 'Mahasiswa' },
    { name: 'Azmy Ayu Ishfahani', username: 'azmy_ayu', email: 'azmy.ayu@example.com', address: 'Kota Bandung', birthdate: new Date('1997-02-17'), password: 'changeme', occupationName: 'Mahasiswa' },
    { name: 'Agam Andika', username: 'agam_andika', email: 'agam.andika@example.com', address: 'Bandung', birthdate: new Date('1997-02-17'), password: 'changeme', occupationName: 'Suami/Istri' },
];

type OccupationCache = Map<string, { id: string }>;

async function upsertUsersWithOccupations(data: UserSeed[]): Promise<{ id: string }[]> {
    const occupationCache: OccupationCache = new Map();
    const users: { id: string }[] = [];

    for (const u of data) {
        if (!occupationCache.has(u.occupationName)) {
            const occ = await prisma.occupation.upsert({
                where: { name: u.occupationName },
                create: { name: u.occupationName },
                update: {},
                select: { id: true },
            });
            occupationCache.set(u.occupationName, occ);
        }

        const hashedPassword = await bcrypt.hash(u.password, saltRounds);
        const user = await prisma.user.upsert({
            where: { email: u.email },
            create: {
                name: u.name,
                username: u.username,
                email: u.email,
                address: u.address,
                birthdate: u.birthdate,
                password: hashedPassword,
                occupationId: occupationCache.get(u.occupationName)!.id,
            },
            update: {},
            select: { id: true },
        });
        users.push(user);
    }

    return users;
}

async function loadAndGroupSubcategories(): Promise<Record<string, string[]>> {
    const subcategories = await prisma.subcategory.findMany({ select: { id: true, categoryId: true } });
    if (subcategories.length === 0) {
        console.error('No subcategories found—run your category seed first.');
        process.exit(1);
    }
    const grouped: Record<string, string[]> = {};
    for (const s of subcategories) {
        grouped[s.categoryId] = grouped[s.categoryId] || [];
        grouped[s.categoryId]?.push(s.id);
    }
    return grouped;
}

function computeDateRange(): { startDate: Date; endDate: Date; totalDays: number } {
    const endDate = new Date();
    const startDate = subMonths(endDate, 2);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { startDate, endDate, totalDays };
}

function randomDateForDay(day: Date): Date {
    const dateStart = new Date(day.setHours(0, 0, 0, 0));
    const randomMinutes = Math.floor(Math.random() * 24 * 60);
    const randomMs = Math.floor(Math.random() * 60_000);
    return addMilliseconds(dateStart, randomMinutes * 60_000 + randomMs);
}

function generateRandomAmount(): number {
    return Math.round((10_000 + Math.random() * 490_000) / 500) * 500;
}

async function createPeriod(userId: string, startDate: Date, endDate: Date) {
    await prisma.period.create({
        data: {
            userId,
            startDate,
            endDate,
            periodType: 'income',
            description: 'Seeded two-month income period',
        },
    });
}

async function seedTransactionsForUser(
    userId: string,
    byCategory: Record<string, string[]>,
    totalDays: number
) {
    const records: Array<{ userId: string; subcategoryId: string; description: string; date: Date; amount: number }> = [];
    for (let d = 0; d < totalDays; d++) {
        const day = subDays(new Date(), d);
        for (const subcatIds of Object.values(byCategory)) {
            for (const subcatId of subcatIds) {
                for (let i = 0; i < 2; i++) {
                    records.push({
                        userId,
                        subcategoryId: subcatId,
                        description: `Transaction in subcategory ${subcatId}`,
                        date: randomDateForDay(day),
                        amount: generateRandomAmount(),
                    });
                }
            }
        }
    }
    await prisma.transaction.createMany({ data: records });
}

async function main() {
    const users = await upsertUsersWithOccupations(userData);
    const byCategory = await loadAndGroupSubcategories();
    const { startDate, endDate, totalDays } = computeDateRange();

    for (const user of users) {
        await createPeriod(user.id, startDate, endDate);
        await seedTransactionsForUser(user.id, byCategory, totalDays);
        console.log(`User ${user.id}: seeded ${totalDays * 2 * Object.values(byCategory).flat().length} transactions`);
    }

    console.log('✅ Done seeding users, periods, and transactions!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
