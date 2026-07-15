import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { logActivity } from "@/lib/leaveHelper";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verifikasi Admin
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "PIMPINAN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const leaveId = id;

    // Ambil detail pengajuan cuti beserta data karyawan
    const leaveRequest = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (decoded.role === "PIMPINAN") {
      const manager = await prisma.employee.findUnique({
        where: { id: decoded.userId }
      });
      if (!manager || manager.department !== leaveRequest.employee.department) {
        return NextResponse.json({ error: "Akses ditolak, Anda hanya dapat memproses cuti dari departemen Anda sendiri" }, { status: 403 });
      }
      if (leaveRequest.employee.role !== "PELAKSANA") {
        return NextResponse.json({ error: "Akses ditolak, Anda hanya dapat memproses cuti untuk Karyawan Pelaksana" }, { status: 403 });
      }
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Pengajuan ini sudah diproses sebelumnya" }, { status: 400 });
    }

    // Update status menjadi REJECTED
    const updated = await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "REJECTED" },
    });

    // Catat log aktivitas menolak cuti
    await logActivity(decoded.userId, `Menolak cuti ${leaveRequest.leaveType} ${leaveRequest.employee.name} (${leaveRequest.totalDays} hari)`);

    return NextResponse.json({ message: "Pengajuan cuti berhasil ditolak", leave: updated });
  } catch (error) {
    console.error("Reject leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
