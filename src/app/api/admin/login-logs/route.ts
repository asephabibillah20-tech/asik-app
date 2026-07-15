import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { logActivity } from "@/lib/leaveHelper";

// GET: Ambil log login
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const totalLogs = await prisma.loginLog.count();
    const totalPages = Math.ceil(totalLogs / limit);

    const logs = await prisma.loginLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        employee: {
          select: {
            nik: true,
            name: true,
            role: true,
            position: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      logs,
      totalLogs,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error("GET login-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Hapus semua log login (Clear All)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Hapus semua log login
    await prisma.loginLog.deleteMany();

    // Catat tindakan pengosongan ini sebagai log awal baru
    await logActivity(decoded.userId, "Mengosongkan semua log aktivitas sistem");

    return NextResponse.json({ message: "Semua log login berhasil dikosongkan" });
  } catch (error) {
    console.error("DELETE all login-logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
