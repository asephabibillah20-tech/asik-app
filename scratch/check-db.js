const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const pendingLeaves = await prisma.leave.count({ where: { status: "PENDING" } });
  const logsCount = await prisma.loginLog.count();
  console.log("Database status:");
  console.log("- Pending Leaves count:", pendingLeaves);
  console.log("- LoginLog count:", logsCount);
  
  if (logsCount > 0) {
    const logs = await prisma.loginLog.findMany({ take: 5, include: { employee: true } });
    console.log("- Sample logs:", logs.map(l => ({ id: l.id, activity: l.activity, device: l.device, emp: l.employee?.name })));
  }
}

main().finally(() => prisma.$disconnect());
