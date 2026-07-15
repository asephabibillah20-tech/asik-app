import { prisma } from "./prisma";
import { calculateLeaveDays } from "@/utils/holidays";
import { headers } from "next/headers";

export { calculateLeaveDays };

/**
 * Menghitung selisih tahun secara presisi berdasarkan hari pengangkatan (anniversary)
 */
function getExactYearsOfService(hireDate: Date, targetDate: Date): number {
  let years = targetDate.getFullYear() - hireDate.getFullYear();
  const hireMonth = hireDate.getMonth();
  const hireDay = hireDate.getDate();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  if (targetMonth < hireMonth || (targetMonth === hireMonth && targetDay < hireDay)) {
    years--;
  }
  return years;
}

/**
 * Menghitung sisa kuota cuti tahunan dan cuti panjang karyawan secara dinamis
 * berdasarkan riwayat pengajuan cuti APPROVED dalam blok masa aktif saat ini.
 * Memperbarui data Employee di database dan mengembalikannya.
 */
export async function syncEmployeeQuotas(employeeId: string) {
  // 1. Ambil data karyawan beserta riwayat cuti APPROVED
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      leaves: {
        where: { status: "APPROVED" },
      },
    },
  });

  if (!employee) {
    throw new Error("Karyawan tidak ditemukan");
  }

  if (employee.role === "ADMIN") {
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        leaveAnnual: 0,
        leaveLong: 0,
      },
    });
    return updatedEmployee;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const joinedAt = new Date(employee.joinedAt);
  joinedAt.setHours(12, 0, 0, 0);

  const hireDate = new Date(employee.hireDate);
  hireDate.setHours(12, 0, 0, 0);

  // ==========================================
  // LOGIKA 1: SINKRONISASI CUTI TAHUNAN (DENGAN UTANG KARIER)
  // ==========================================
  // Buat seluruh periode tahunan sejak joinedAt hingga hari ini
  let periods: { start: Date; end: Date }[] = [];
  let currentStart = new Date(joinedAt);
  
  while (currentStart < today) {
    let nextEnd = new Date(currentStart);
    nextEnd.setFullYear(currentStart.getFullYear() + 1);
    periods.push({
      start: new Date(currentStart),
      end: nextEnd
    });
    currentStart = nextEnd;
  }
  
  if (periods.length === 0) {
    let nextEnd = new Date(joinedAt);
    nextEnd.setFullYear(joinedAt.getFullYear() + 1);
    periods.push({ start: new Date(joinedAt), end: nextEnd });
  }

  let debt = 0;
  let newAnnualBalance = 0;

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const baseQuota = 12;

    // Filter cuti tahunan APPROVED yang jatuh pada periode ini
    const leavesInPeriod = employee.leaves.filter((leave) => {
      if (leave.leaveType !== "TAHUNAN") return false;
      const leaveStart = new Date(leave.startDate);
      return leaveStart >= period.start && leaveStart < period.end;
    });

    const totalDaysTaken = leavesInPeriod.reduce((sum, leave) => sum + leave.totalDays, 0);
    
    // Saldo awal periode ini = quota + hutang tahun lalu
    const startingBalance = baseQuota + debt;
    
    // Saldo akhir periode ini = saldo awal - cuti yang diambil
    const periodBalance = startingBalance - totalDaysTaken;
    
    // Jika negatif, ini adalah hutang yang dipindahkan ke tahun berikutnya.
    if (periodBalance < 0) {
      debt = periodBalance;
    } else {
      debt = 0;
    }

    if (i === periods.length - 1) {
      newAnnualBalance = periodBalance;
    }
  }

  // Jika karyawan PKWT, mereka tidak berhak mendapatkan cuti panjang (selalu 0)
  if (employee.contractType === "PKWT") {
    const approvedLongLeaves = employee.leaves.filter((leave) => leave.leaveType === "PANJANG");
    const totalLongDaysTaken = approvedLongLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        leaveAnnual: newAnnualBalance,
        leaveLong: 0 - totalLongDaysTaken,
      },
    });
    return updatedEmployee;
  }

  // ==========================================
  // LOGIKA 2: SINKRONISASI CUTI PANJANG (DENGAN UTANG KARIER)
  // ==========================================
  let longPeriods: { start: Date; end: Date; quota: number }[] = [];
  
  // Periode 0 (Tahun 0 - 6): kuota = 0
  let p0End = new Date(hireDate);
  p0End.setFullYear(hireDate.getFullYear() + 6);
  longPeriods.push({ start: new Date(hireDate), end: p0End, quota: 0 });
  
  // Periode berikutnya (6 tahun sekali): kuota = 45
  let currentLongStart = new Date(p0End);
  while (currentLongStart < today) {
    let nextLongEnd = new Date(currentLongStart);
    nextLongEnd.setFullYear(currentLongStart.getFullYear() + 6);
    longPeriods.push({
      start: new Date(currentLongStart),
      end: nextLongEnd,
      quota: 45
    });
    currentLongStart = nextLongEnd;
  }

  let longDebt = 0;
  let newLongBalance = 0;

  for (let i = 0; i < longPeriods.length; i++) {
    const period = longPeriods[i];
    
    // Filter cuti APPROVED yang memotong kuota cuti panjang pada periode ini:
    // Hanya tipe cuti PANJANG yang dimulai di periode ini
    const leavesInPeriod = employee.leaves.filter((leave) => {
      if (leave.leaveType !== "PANJANG") return false;
      const leaveStart = new Date(leave.startDate);
      return leaveStart >= period.start && leaveStart < period.end;
    });

    const totalDaysTaken = leavesInPeriod.reduce((sum, leave) => sum + leave.totalDays, 0);
    const startingBalance = period.quota + longDebt;
    const periodBalance = startingBalance - totalDaysTaken;
    
    if (periodBalance < 0) {
      longDebt = periodBalance;
    } else {
      longDebt = 0;
    }

    if (i === longPeriods.length - 1) {
      newLongBalance = periodBalance;
    }
  }

  // 3. Update database dengan sisa kuota terbaru
  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      leaveAnnual: newAnnualBalance,
      leaveLong: newLongBalance,
    },
  });

  return updatedEmployee;
}

/**
 * Logika utilitas cuti panjang yang lama (dihapus/dinonaktifkan
 * karena digantikan logika reset syncEmployeeQuotas di atas, 
 * namun tetap diexport agar tidak memicu error kompilasi luar jika ada import).
 */
export function calculateLongLeave(hireDate: Date | string): number {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - new Date(hireDate).getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  
  if (diffYears >= 6) {
    return 45;
  }
  return 0;
}

export function parseUserAgent(userAgentStr: string | null): string {
  if (!userAgentStr) return "Perangkat Tidak Dikenal";
  const ua = userAgentStr.toLowerCase();
  if (ua.includes("android")) return "Android (Mobile)";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS (Mobile)";
  if (ua.includes("windows")) return "Windows (PC)";
  if (ua.includes("macintosh") || ua.includes("mac os")) return "macOS (PC)";
  if (ua.includes("linux")) return "Linux (PC)";
  return "Perangkat Lain";
}

export async function logActivity(employeeId: string, activity: string) {
  try {
    let userAgentStr: string | null = null;
    try {
      const headersList = await headers();
      userAgentStr = headersList.get("user-agent");
    } catch (e) {
      console.warn("Could not read headers in logActivity:", e);
    }
    const device = parseUserAgent(userAgentStr);

    await prisma.loginLog.create({
      data: {
        employeeId,
        activity,
        device,
      },
    });
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
  }
}
