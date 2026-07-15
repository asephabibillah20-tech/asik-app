const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.employee.updateMany({
    where: { role: 'KARYAWAN' },
    data: { role: 'PELAKSANA' },
  });
  console.log(`Successfully migrated ${result.count} employees from KARYAWAN to PELAKSANA.`);
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
