import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/auth";
import { hashPassword } from "@/utils/auth";
import { syncEmployeeQuotas, logActivity } from "@/lib/leaveHelper";

// Helper untuk validasi admin
async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = await verifyJWT(token);
  if (!decoded || decoded.role !== "ADMIN") return null;
  return decoded;
}

// GET: Ambil daftar semua karyawan (Admin saja)
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Ambil semua ID karyawan untuk sinkronisasi kuota masal secara pararel
    const rawEmployees = await prisma.employee.findMany({ select: { id: true } });
    try {
      await Promise.all(rawEmployees.map((emp) => syncEmployeeQuotas(emp.id)));
    } catch (syncErr) {
      console.error("Gagal melakukan sinkronisasi kuota masal:", syncErr);
    }

    // Ambil data terbaru setelah disinkronisasi
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nik: true,
        name: true,
        role: true,
        position: true,
        department: true,
        joinedAt: true,
        hireDate: true,
        leaveAnnual: true,
        leaveLong: true,
        status: true,
        contractType: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("GET employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Tambah karyawan baru (Admin saja)
export async function POST(req: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    // Check if batch insert
    if (body.batch && Array.isArray(body.batch)) {
      const created = [];
      const errors = [];

      for (const item of body.batch) {
        const { nik, name, password, role, position, department, joinedAt, hireDate, status, contractType } = item;

        if (!nik || !name || !password || !position || !department || !joinedAt || !hireDate) {
          errors.push({ nik: nik || "Tanpa NIK", error: "Field wajib diisi (NIK, Nama, Password, Jabatan, Departemen, Tanggal Masuk, Tanggal Pengangkatan)" });
          continue;
        }

        const existing = await prisma.employee.findUnique({ where: { nik: String(nik) } });
        if (existing) {
          errors.push({ nik, error: "NIK sudah terdaftar" });
          continue;
        }

        const hashedPassword = await hashPassword(String(password));

        const employee = await prisma.employee.create({
          data: {
            nik: String(nik),
            name: String(name),
            password: hashedPassword,
            role: role || "PELAKSANA",
            position: String(position),
            department: String(department),
            status: status || "AKTIF",
            contractType: contractType || "PKWTT",
            joinedAt: new Date(joinedAt),
            hireDate: new Date(hireDate),
            leaveAnnual: 12,
            leaveLong: 0,
          },
        });

        await syncEmployeeQuotas(employee.id);
        created.push({ id: employee.id, nik: employee.nik, name: employee.name });
      }

      await logActivity(
        admin.userId,
        `Melakukan upload batch karyawan: Berhasil ${created.length} orang, Gagal ${errors.length} orang`
      );

      return NextResponse.json({
        message: `Impor batch selesai. Berhasil: ${created.length}, Gagal: ${errors.length}`,
        created,
        errors,
      });
    }

    const { nik, name, password, role, position, department, joinedAt, hireDate, status, contractType } = body;

    if (!nik || !name || !password || !position || !department || !hireDate) {
      return NextResponse.json({ error: "Field wajib diisi" }, { status: 400 });
    }

    // Cek jika NIK sudah ada
    const existing = await prisma.employee.findUnique({ where: { nik } });
    if (existing) {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
    }

    // Enkripsi password
    const hashedPassword = await hashPassword(password);

    // Buat karyawan baru dengan kuota default 12 tahunan dan 0 panjang
    const employee = await prisma.employee.create({
      data: {
        nik,
        name,
        password: hashedPassword,
        role: role || "PELAKSANA",
        position,
        department,
        status: status || "AKTIF",
        contractType: contractType || "PKWTT",
        joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
        hireDate: new Date(hireDate),
        leaveAnnual: 12,
        leaveLong: 0,
      },
    });

    // Panggil syncEmployeeQuotas untuk menghitung kuota awal secara dinamis sesuai hireDate/joinedAt baru
    await syncEmployeeQuotas(employee.id);

    // Catat log aktivitas tambah karyawan
    await logActivity(admin.userId, `Menambah karyawan baru: ${name} (NIK: ${nik}, Role: ${role})`);

    return NextResponse.json({
      message: "Karyawan berhasil ditambahkan",
      employee: {
        id: employee.id,
        nik: employee.nik,
        name: employee.name,
      },
    });
  } catch (error) {
    console.error("POST employee error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
