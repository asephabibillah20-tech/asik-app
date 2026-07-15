import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signJWT } from "@/utils/auth";
import { logActivity } from "@/lib/leaveHelper";

export async function POST(req: Request) {
  try {
    const { nik, password } = await req.json();

    if (!nik || !password) {
      return NextResponse.json(
        { error: "NIK dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Cari karyawan berdasarkan NIK
    const employee = await prisma.employee.findUnique({
      where: { nik },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan atau password salah" },
        { status: 401 }
      );
    }

    // Blokir login jika status tidak AKTIF
    if (employee.status !== "AKTIF") {
      let statusLabel = "Tidak Aktif";
      if (employee.status === "PENSIUN") statusLabel = "Pensiun";
      else if (employee.status === "PTDH") statusLabel = "Pemberhentian Tidak Dengan Hormat (PTDH)";

      return NextResponse.json(
        { error: `Gagal masuk: Status akun Anda adalah ${statusLabel}. Silakan hubungi HR.` },
        { status: 403 }
      );
    }

    // Bandingkan password
    const isMatch = await comparePassword(password, employee.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan atau password salah" },
        { status: 401 }
      );
    }

    // Buat token JWT
    const token = await signJWT({
      userId: employee.id,
      nik: employee.nik,
      role: employee.role,
      name: employee.name,
    });

    // Catat log aktivitas login ke database
    await logActivity(employee.id, "LOGIN");

    // Buat response
    const response = NextResponse.json({
      message: "Login berhasil",
      user: {
        id: employee.id,
        nik: employee.nik,
        name: employee.name,
        role: employee.role,
      },
    });

    // Set cookie HTTP-only
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 jam
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
