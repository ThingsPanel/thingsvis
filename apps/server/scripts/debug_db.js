
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const targetId = 'd2b366aa-4c40-41d8-9066-ac884b00b0ac';
    console.log('Searching for Dashboard with ID:', targetId);

    try {
        const d = await prisma.dashboard.findUnique({
            where: { id: targetId }
        });

        if (d) {
            console.log('FOUND Dashboard:', d);
        } else {
            console.log('Dashboard NOT FOUND.');
        }

        // List all dashboards to see format
        const all = await prisma.dashboard.findMany({ take: 5 });
        console.log('Sample Dashboards in DB:', all.map(x => ({ id: x.id, name: x.name })));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
