import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verifikasi Admin
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak, hanya Admin yang diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    const leaveId = id;

    // Ambil detail pengajuan cuti beserta data karyawan
    const leaveDetails = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!leaveDetails) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (leaveDetails.status !== "PENDING") {
      return NextResponse.json({ error: "Pengajuan ini sudah diproses sebelumnya" }, { status: 400 });
    }

    const { employee, totalDays, leaveType } = leaveDetails;
    const currentBalance = leaveType === "TAHUNAN" ? employee.leaveAnnual : employee.leaveLong;
    
    // Deteksi jika kuota tidak cukup -> Otomatis masuk skema Pinjam Cuti
    const isBorrowed = currentBalance < totalDays;
    const newBalance = currentBalance - totalDays; // Hasil bisa minus/negatif

    // Update Transaksional Database
    await prisma.$transaction([
      prisma.leave.update({
        where: { id: leaveId },
        data: { status: "APPROVED", isBorrowed },
      }),
      prisma.employee.update({
        where: { id: employee.id },
        data: leaveType === "TAHUNAN" ? { leaveAnnual: newBalance } : { leaveLong: newBalance },
      }),
    ]);

    return NextResponse.json({ message: "Pengajuan berhasil disetujui" });
  } catch (error) {
    console.error("Approve leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
