import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/utils/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nik: true,
        name: true,
        role: true,
        position: true,
        department: true,
        joinedAt: true,
        hireDate: true,
        leaveAnnual: true,
        leaveLong: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user: employee });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
