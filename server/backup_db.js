const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Backing up Report and Session tables...');
        const reports = await prisma.report.findMany();
        const sessions = await prisma.session.findMany();
        const leads = await prisma.lead.findMany();
        
        const backup = { reports, sessions, leads };
        
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `db_backup_${dateStr}.json`;
        
        // We have to handle BigInt serialization
        const jsonBackup = JSON.stringify(backup, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        , 2);
        
        fs.writeFileSync(filename, jsonBackup);
        console.log(`Backup completed successfully. Saved to ${filename}`);
    } catch (err) {
        console.error('Backup failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
