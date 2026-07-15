import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leaveCount = await prisma.leave.count();
    const employeeCount = await prisma.employee.count();
    
    // Ambil tanggal update terakhir dari model Leave dan Employee
    const latestLeave = await prisma.leave.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    });
    
    const latestEmployee = await prisma.employee.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    });
    
    const lastUpdate = Math.max(
      latestLeave?.updatedAt ? new Date(latestLeave.updatedAt).getTime() : 0,
      latestEmployee?.updatedAt ? new Date(latestEmployee.updatedAt).getTime() : 0
    );

    return NextResponse.json({
      leaveCount,
      employeeCount,
      lastUpdate,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat status update" }, { status: 500 });
  }
}
