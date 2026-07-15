import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { logActivity } from "@/lib/leaveHelper";

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
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const logId = id;

    // Cari log untuk info detail sebelum dihapus
    const log = await prisma.loginLog.findUnique({
      where: { id: logId },
      include: { employee: true },
    });

    if (!log) {
      return NextResponse.json({ error: "Log tidak ditemukan" }, { status: 404 });
    }

    // Hapus log login berdasarkan ID
    await prisma.loginLog.delete({
      where: { id: logId },
    });

    // Catat log aktivitas penghapusan baris log
    await logActivity(decoded.userId, `Menghapus baris log aktivitas milik ${log.employee.name} (${log.activity || "LOGIN"})`);

    return NextResponse.json({ message: "Log login berhasil dihapus" });
  } catch (error) {
    console.error("DELETE individual login log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
