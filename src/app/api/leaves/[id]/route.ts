import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { syncEmployeeQuotas, logActivity } from "@/lib/leaveHelper";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Cari pengajuan cuti terlebih dahulu untuk mendapatkan employeeId
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    const employeeId = leave.employeeId;

    // Hapus pengajuan cuti
    await prisma.leave.delete({
      where: { id: leaveId },
    });

    // Sinkronkan ulang kuota karyawan (saldo otomatis pulih jika cuti yang dihapus berstatus APPROVED)
    await syncEmployeeQuotas(employeeId);

    // Catat log aktivitas menghapus cuti
    await logActivity(decoded.userId, `Menghapus pengajuan cuti ${leave.leaveType} milik ${leave.employee.name} (${leave.totalDays} hari)`);

    return NextResponse.json({ message: "Pengajuan cuti berhasil dihapus" });
  } catch (error) {
    console.error("DELETE leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
