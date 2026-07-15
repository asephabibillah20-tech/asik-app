import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";

// Helper untuk validasi auth
async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

// GET: Mengambil riwayat pengajuan cuti
export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let leaves;
    if (user.role === "ADMIN") {
      // Admin: Lihat semua pengajuan
      leaves = await prisma.leave.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              nik: true,
              name: true,
              position: true,
              department: true,
              leaveAnnual: true,
              leaveLong: true,
            },
          },
        },
      });
    } else {
      // Karyawan: Hanya lihat pengajuan sendiri
      leaves = await prisma.leave.findMany({
        where: { employeeId: user.userId },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error("GET leaves error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Mengajukan cuti baru
export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "KARYAWAN") {
      return NextResponse.json({ error: "Hanya karyawan yang dapat mengajukan cuti" }, { status: 403 });
    }

    const body = await req.json();
    const { startDate, endDate, leaveType, reason } = body;

    if (!startDate || !endDate || !leaveType || !reason) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json({ error: "Tanggal selesai tidak boleh sebelum tanggal mulai" }, { status: 400 });
    }

    // Hitung total hari cuti (inklusif)
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Ambil info karyawan untuk cek kuota
    const employee = await prisma.employee.findUnique({
      where: { id: user.userId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    // Tentukan saldo kuota yang saat ini tersedia
    const currentBalance = leaveType === "TAHUNAN" ? employee.leaveAnnual : employee.leaveLong;

    // Deteksi jika harus meminjam cuti (kuota tidak mencukupi)
    const isBorrowed = currentBalance < totalDays;

    // Buat pengajuan cuti baru dengan status PENDING
    const leaveRequest = await prisma.leave.create({
      data: {
        employeeId: user.userId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        leaveType,
        isBorrowed,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Pengajuan cuti berhasil dikirim",
      leave: leaveRequest,
    });
  } catch (error) {
    console.error("POST leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
