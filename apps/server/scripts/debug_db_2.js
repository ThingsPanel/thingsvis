
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const targetId = 'd2b366aa-4c40-41d8-9066-ac884b00b0ac';
    console.log('Searching for Project with ID:', targetId);

    try {
        const p = await prisma.project.findUnique({
            where: { id: targetId }
        });

        if (p) {
            console.log('FOUND Project:', p);
        } else {
            console.log('Project NOT FOUND.');
        }

        const d = await prisma.dashboard.findUnique({
            where: { id: targetId }
        });
        if (d) console.log('Also FOUND as Dashboard:', d);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
