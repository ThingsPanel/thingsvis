const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const dashboards = await prisma.dashboard.count();
    const projects = await prisma.project.count();
    
    
    
    
    
    if (projects > 0) {
      
      const recentProjects = await prisma.project.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true }
      });
      recentProjects.forEach(p => {
        
      });
    }
    
    if (dashboards > 0) {
      
      const recentDashboards = await prisma.dashboard.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true }
      });
      recentDashboards.forEach(d => {
        
      });
    }
  } catch (error) {
    
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
