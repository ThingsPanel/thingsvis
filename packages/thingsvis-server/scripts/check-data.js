const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const dashboards = await prisma.dashboard.count();
    const projects = await prisma.project.count();
    
    console.log('📊 数据库统计:');
    console.log('  Projects:', projects);
    console.log('  Dashboards:', dashboards);
    
    if (projects > 0) {
      console.log('\n最近的项目:');
      const recentProjects = await prisma.project.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true }
      });
      recentProjects.forEach(p => {
        console.log(`  - ${p.name} (${p.id})`);
      });
    }
    
    if (dashboards > 0) {
      console.log('\n最近的画布:');
      const recentDashboards = await prisma.dashboard.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true }
      });
      recentDashboards.forEach(d => {
        console.log(`  - ${d.name} (${d.id})`);
      });
    }
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
