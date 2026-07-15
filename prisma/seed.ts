import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.leave.deleteMany({});
  await prisma.employee.deleteMany({});

  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("karyawan123", 10);

  console.log("Seeding data...");

  // 1. Admin
  await prisma.employee.create({
    data: {
      nik: "123456",
      password: adminPassword,
      name: "Budi Santoso",
      role: "ADMIN",
      position: "HR Manager",
      department: "Human Resources",
      joinedAt: new Date("2015-01-10T00:00:00Z"),
      hireDate: new Date("2015-01-10T00:00:00Z"),
      leaveAnnual: 12,
      leaveLong: 0,
    },
  });

  // 2. Karyawan 1 (Masa Kerja 7 tahun - berhak cuti panjang 45 hari)
  const hireDate1 = new Date();
  hireDate1.setFullYear(hireDate1.getFullYear() - 7);
  await prisma.employee.create({
    data: {
      nik: "654321",
      password: employeePassword,
      name: "Agus Pratama",
      role: "KARYAWAN",
      position: "Senior Web Developer",
      department: "IT",
      joinedAt: hireDate1,
      hireDate: hireDate1,
      leaveAnnual: 12,
      leaveLong: 45, // 1 periode kelipatan 6 tahun
    },
  });

  // 3. Karyawan 2 (Masa Kerja 3 tahun - tidak berhak cuti panjang)
  const hireDate2 = new Date();
  hireDate2.setFullYear(hireDate2.getFullYear() - 3);
  await prisma.employee.create({
    data: {
      nik: "789012",
      password: employeePassword,
      name: "Siti Rahma",
      role: "KARYAWAN",
      position: "UI/UX Designer",
      department: "IT",
      joinedAt: hireDate2,
      hireDate: hireDate2,
      leaveAnnual: 12,
      leaveLong: 0,
    },
  });

  // 4. Karyawan 3 (Masa Kerja 13 tahun - berhak cuti panjang 90 hari)
  const hireDate3 = new Date();
  hireDate3.setFullYear(hireDate3.getFullYear() - 13);
  await prisma.employee.create({
    data: {
      nik: "345678",
      password: employeePassword,
      name: "Eko Prasetyo",
      role: "KARYAWAN",
      position: "Technical Architect",
      department: "IT",
      joinedAt: hireDate3,
      hireDate: hireDate3,
      leaveAnnual: 12,
      leaveLong: 90, // 2 periode kelipatan 6 tahun (2 * 45)
    },
  });

  console.log("Seeding database success!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
