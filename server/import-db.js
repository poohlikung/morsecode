require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
    console.log('Starting import...');

    let prisma;
    let pool = null;

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql')) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
    } else {
        const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
        const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
        prisma = new PrismaClient({ adapter });
    }

    try {
        const rawData = fs.readFileSync('database_export.json', 'utf8');
        const data = JSON.parse(rawData);

        // Order matters for foreign key constraints!
        // Clear existing data using deleteMany (fully compatible with SQLite and PostgreSQL)
        console.log('Clearing existing data...');
        await prisma.sessionDetail.deleteMany();
        await prisma.playSession.deleteMany();
        await prisma.userModeStatus.deleteMany();
        await prisma.content.deleteMany();
        await prisma.settings.deleteMany();
        await prisma.user.deleteMany();
        await prisma.difficulty.deleteMany();
        await prisma.symbol.deleteMany();
        await prisma.mode.deleteMany();

        // 1. Insert Lookup Tables
        console.log('Importing Modes...');
        if (data.modes?.length) await prisma.mode.createMany({ data: data.modes });

        console.log('Importing Symbols...');
        if (data.symbols?.length) await prisma.symbol.createMany({ data: data.symbols });

        console.log('Importing Difficulties...');
        if (data.difficulties?.length) await prisma.difficulty.createMany({ data: data.difficulties });

        // 2. Insert Users and Settings
        console.log('Importing Users...');
        if (data.users?.length) await prisma.user.createMany({ data: data.users });

        console.log('Importing Settings...');
        if (data.settings?.length) await prisma.settings.createMany({ data: data.settings });

        // 3. Insert Stats and Game Data
        console.log('Importing Contents...');
        if (data.contents?.length) await prisma.content.createMany({ data: data.contents });

        console.log('Importing UserModeStatuses...');
        if (data.userModeStatuses?.length) await prisma.userModeStatus.createMany({ data: data.userModeStatuses });

        console.log('Importing PlaySessions...');
        if (data.playSessions?.length) await prisma.playSession.createMany({ data: data.playSessions });

        console.log('Importing SessionDetails...');
        if (data.sessionDetails?.length) await prisma.sessionDetail.createMany({ data: data.sessionDetails });

        console.log('Import complete! 🎉');
    } catch (error) {
        console.error('Error importing database:', error.stack);
    } finally {
        await prisma.$disconnect();
        if (pool) await pool.end();
    }
}

main().catch(e => {
    console.error('Unhandled error:', e.message);
    process.exit(1);
});
