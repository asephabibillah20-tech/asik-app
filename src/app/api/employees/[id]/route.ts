import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { hashPassword } from "@/utils/auth";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = await verifyJWT(token);
  if (!decoded || decoded.role !== "ADMIN") return null;
  return decoded;
}

// PUT: Perbarui data karyawan (Admin saja)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nik, name, password, role, position, department, joinedAt, hireDate, leaveAnnual, leaveLong } = body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    // Bangun data update
    const updateData: any = {
      nik,
      name,
      role,
      position,
      department,
      joinedAt: joinedAt ? new Date(joinedAt) : undefined,
      hireDate: hireDate ? new Date(hireDate) : undefined,
      leaveAnnual: leaveAnnual !== undefined ? parseInt(leaveAnnual) : undefined,
      leaveLong: leaveLong !== undefined ? parseInt(leaveLong) : undefined,
    };

    // Jika password diisi, update password
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Karyawan berhasil diperbarui", employee: updated });
  } catch (error) {
    console.error("PUT employee error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Hapus karyawan (Admin saja)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({ message: "Karyawan berhasil dihapus" });
  } catch (error) {
    console.error("DELETE employee error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
