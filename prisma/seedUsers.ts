// prisma/seedUsers.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { loadEnvironmentVariable } from '../src/utils/environmentVariableHandler';

const prisma = new PrismaClient();

interface UserSeed {
    name: string;
    username: string;
    email: string;
    address: string;
    birthdate: Date;
    passwordPlainText: string; // Store plain text here for seeding, hash before saving
    occupationName: string;    // This should match names in seedOccupations.ts
}

const userData: UserSeed[] = [
    { name: 'Muchamad Diaz Adhari', username: 'muchamad_diaz', email: 'diaz.adhari@example.com', address: 'Kota Bandung', birthdate: new Date('2003-02-23'), passwordPlainText: 'password123', occupationName: 'Pekerja' },
    { name: 'Bilsen Natan Sius', username: 'bilsen_sius', email: 'bilsen.sius@example.com', address: 'Kota Cimahi', birthdate: new Date('2007-01-22'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Aura Lestari', username: 'aura_lestari', email: 'aura.lestari@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2007-06-02'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Ikhsan Muhammad Fajar', username: 'ikhsan_fajar', email: 'ikhsan.fajar@example.com', address: 'Kabupaten Sumedang', birthdate: new Date('2003-09-19'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' }, // Assuming Mahasiswa maps here
    { name: 'Fariz Alfarizi', username: 'fariz_alfarizi', email: 'fariz.alfarizi@example.com', address: 'Kabupaten Bandung Barat', birthdate: new Date('2003-02-12'), passwordPlainText: 'password123', occupationName: 'Pekerja' },
    { name: 'Wulan Agustina', username: 'wulan_agustina', email: 'wulan.agustina@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2007-08-17'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Reni Apriani', username: 'reni_apriani', email: 'reni.apriani@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2004-04-28'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Rindi Afriani', username: 'rindi_afriani', email: 'rindi.afriani@example.com', address: 'Kabupaten Bandung', birthdate: new Date('2004-08-29'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Reqi Jumantara', username: 'reqi_jumantara', email: 'reqi.jumantara@example.com', address: 'Bandung', birthdate: new Date('2005-04-23'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Azmy Ayu Ishfahani', username: 'azmy_ayu', email: 'azmy.ayu@example.com', address: 'Kota Bandung', birthdate: new Date('1997-02-17'), passwordPlainText: 'password123', occupationName: 'Pelajar/Mahasiswa' },
    { name: 'Agam Andika', username: 'agam_andika', email: 'agam.andika@example.com', address: 'Bandung', birthdate: new Date('1997-02-17'), passwordPlainText: 'password123', occupationName: 'Suami/Istri' },
];

async function main() {
    console.log(`Start seeding users ...`);

    for (const u of userData) {
        const occupation = await prisma.occupation.findUnique({
            where: { name: u.occupationName },
        });

        if (!occupation) {
            console.error(`Occupation "${u.occupationName}" not found for user "${u.name}". Please ensure occupations are seeded first or names match.`);
            continue; // Skip this user or handle error as needed
        }
        const hashedPassword = await bcrypt.hash(u.passwordPlainText, Number(loadEnvironmentVariable('SALT_ROUNDS')));

        try {
            const user = await prisma.user.upsert({
                where: { email: u.email },
                update: { // Update existing users if necessary, e.g., password or occupation
                    name: u.name,
                    username: u.username,
                    address: u.address,
                    birthdate: u.birthdate,
                    password: hashedPassword,
                    occupationId: occupation.id,
                },
                create: {
                    name: u.name,
                    username: u.username,
                    email: u.email,
                    address: u.address,
                    birthdate: u.birthdate,
                    password: hashedPassword,
                    occupationId: occupation.id,
                },
            });
            console.log(`Created or updated user with id: ${user.id} (${user.email})`);
        } catch (error: any) {
            if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
                console.warn(`User with username "${u.username}" already exists (email: ${u.email}). Skipping or updating if necessary.`);
            } else {
                console.error(`Failed to upsert user ${u.email}:`, error);
            }
        }
    }
    console.log(`Seeding users finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });