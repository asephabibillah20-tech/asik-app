import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { syncEmployeeQuotas, logActivity } from "@/lib/leaveHelper";

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
    const leaveDetails = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!leaveDetails) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    let approvedByName = "Budi Santoso";
    let approvedByPosition = "HR Administrator";
    let approvedByNik: string | null = null;

    if (decoded.role === "PIMPINAN") {
      const manager = await prisma.employee.findUnique({
        where: { id: decoded.userId }
      });
      if (!manager || manager.department !== leaveDetails.employee.department) {
        return NextResponse.json({ error: "Akses ditolak, Anda hanya dapat memproses cuti dari departemen Anda sendiri" }, { status: 403 });
      }
      if (leaveDetails.employee.role !== "PELAKSANA") {
        return NextResponse.json({ error: "Akses ditolak, Anda hanya dapat memproses cuti untuk Karyawan Pelaksana" }, { status: 403 });
      }
      approvedByName = manager.name;
      approvedByPosition = manager.position;
      approvedByNik = manager.nik;
    }

    if (leaveDetails.status !== "PENDING") {
      return NextResponse.json({ error: "Pengajuan ini sudah diproses sebelumnya" }, { status: 400 });
    }

    const { employee, totalDays, leaveType } = leaveDetails;

    // 1. Sinkronisasi kuota karyawan teraktual sebelum kalkulasi persetujuan
    const syncedEmployee = await syncEmployeeQuotas(employee.id);
    const currentBalance = leaveType === "TAHUNAN" ? syncedEmployee.leaveAnnual : syncedEmployee.leaveLong;
    
    // Deteksi jika kuota tidak cukup -> Skema Pinjam Cuti
    const isBorrowed = currentBalance < totalDays;

    // 2. Jalankan transaksi database
    await prisma.$transaction(async (tx) => {
      // Perbarui status pengajuan menjadi APPROVED
      await tx.leave.update({
        where: { id: leaveId },
        data: { 
          status: "APPROVED", 
          isBorrowed,
          approvedByName,
          approvedByPosition,
          approvedByNik
        },
      });
    });

    // 3. Sinkronkan ulang saldo cuti karyawan (ini akan otomatis mengurangi kuota di database
    // karena pengajuan di atas statusnya sudah berubah menjadi APPROVED)
    await syncEmployeeQuotas(employee.id);

    // Catat log aktivitas menyetujui cuti
    await logActivity(decoded.userId, `Menyetujui cuti ${leaveType} ${employee.name} (${totalDays} hari)`);

    return NextResponse.json({ message: "Pengajuan berhasil disetujui" });
  } catch (error) {
    console.error("Approve leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
