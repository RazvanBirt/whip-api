import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma-client/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

export let prisma: PrismaClient;
export let isDatabaseConnected = false;

if (!connectionString) {
    console.warn(
        '[DATABASE WARNING] DATABASE_URL is not set. API will start, but database routes will not work.'
    );
} else {
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
}

export async function checkDatabaseConnection() {
    if (!prisma) {
        isDatabaseConnected = false;
        return false;
    }

    try {
        await prisma.$queryRaw`SELECT 1`;
        isDatabaseConnected = true;
        console.log('[DATABASE] Connected successfully.');
        return true;
    } catch (error) {
        isDatabaseConnected = false;
        console.error('[DATABASE WARNING] Could not connect to database.');
        console.error(error);
        return false;
    }
}