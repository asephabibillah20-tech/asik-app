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

    // Ambil detail pengajuan cuti
    const leaveRequest = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Pengajuan ini sudah diproses sebelumnya" }, { status: 400 });
    }

    // Update status menjadi REJECTED
    const updated = await prisma.leave.update({
      where: { id: leaveId },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ message: "Pengajuan cuti berhasil ditolak", leave: updated });
  } catch (error) {
    console.error("Reject leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
