import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { calculateLeaveDays, syncEmployeeQuotas, logActivity } from "@/lib/leaveHelper";

// Helper untuk validasi auth
async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

// GET: Mengambil riwayat pengajuan cuti
export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const isDept = url.searchParams.get("dept") === "true";

    let leaves: any[] = [];
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
              contractType: true,
            },
          },
        },
      });
    } else if (user.role === "PIMPINAN" && isDept) {
      // Karyawan Pimpinan: Lihat pengajuan cuti PELAKSANA di departemen yang sama
      const manager = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { department: true }
      });
      if (manager) {
        leaves = await prisma.leave.findMany({
          where: {
            employee: {
              department: manager.department,
              role: "PELAKSANA"
            }
          },
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
                contractType: true,
              },
            },
          },
        });
      } else {
        leaves = [];
      }
    } else {
      // Karyawan (PIMPINAN/PELAKSANA/KARYAWAN): Hanya lihat pengajuan sendiri
      leaves = await prisma.leave.findMany({
        where: { employeeId: user.userId },
        orderBy: { createdAt: "desc" },
      });
    }

    const processedLeaves = await Promise.all(
      leaves.map(async (leave) => {
        if (leave.status === "APPROVED" && (!leave.approvedByName || !leave.approvedByPosition)) {
          let dept = "";
          if (leave.employee?.department) {
            dept = leave.employee.department;
          } else {
            const emp = await prisma.employee.findUnique({
              where: { id: leave.employeeId },
              select: { department: true }
            });
            if (emp) dept = emp.department;
          }

          if (dept) {
            const manager = await prisma.employee.findFirst({
              where: {
                department: dept,
                role: "PIMPINAN"
              }
            });

            if (manager) {
              return {
                ...leave,
                approvedByName: leave.approvedByName || manager.name,
                approvedByPosition: leave.approvedByPosition || manager.position,
                approvedByNik: leave.approvedByNik || manager.nik
              };
            }
          }
        }
        return leave;
      })
    );

    return NextResponse.json({ leaves: processedLeaves });
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

    if (user.role !== "KARYAWAN" && user.role !== "PIMPINAN" && user.role !== "PELAKSANA") {
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

    // 1. Hitung total hari cuti RIIL (mengabaikan Minggu dan Libur Nasional)
    const totalDays = calculateLeaveDays(start, end);

    if (totalDays <= 0) {
      return NextResponse.json(
        { error: "Pengajuan tidak valid karena tidak ada hari kerja efektif (Hari Minggu / Libur Nasional dikecualikan)" },
        { status: 400 }
      );
    }

    // 2. Sinkronisasi kuota karyawan terlebih dahulu untuk mendapatkan saldo teraktual
    let employee;
    try {
      employee = await syncEmployeeQuotas(user.userId);
    } catch (syncErr) {
      console.error("Gagal sinkronisasi sebelum pengajuan:", syncErr);
      // Fallback ambil langsung dari DB jika sync gagal
      employee = await prisma.employee.findUnique({ where: { id: user.userId } });
    }

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

    // Catat log aktivitas pengajuan cuti
    await logActivity(user.userId, `Mengajukan cuti ${leaveType} selama ${totalDays} hari (${startDate} s/d ${endDate})`);

    return NextResponse.json({
      message: "Pengajuan cuti berhasil dikirim",
      leave: leaveRequest,
    });
  } catch (error) {
    console.error("POST leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
