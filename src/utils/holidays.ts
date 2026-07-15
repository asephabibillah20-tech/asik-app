// src/utils/holidays.ts

// Daftar Hari Libur Nasional Indonesia (2025, 2026, 2027)
export const INDONESIAN_HOLIDAYS: Set<string> = new Set([
  // 2025 Holidays
  "2025-01-01", // Tahun Baru Masehi
  "2025-01-27", // Isra Mi'raj Nabi Muhammad SAW
  "2025-01-29", // Tahun Baru Imlek
  "2025-03-29", // Hari Raya Nyepi
  "2025-03-31", // Hari Raya Idul Fitri 1446 H
  "2025-04-01", // Hari Raya Idul Fitri 1446 H
  "2025-04-18", // Wafat Isa Almasih / Jumat Agung
  "2025-05-01", // Hari Buruh Internasional
  "2025-05-12", // Hari Raya Waisak
  "2025-05-29", // Kenaikan Isa Almasih
  "2025-06-01", // Hari Lahir Pancasila
  "2025-06-06", // Hari Raya Idul Adha 1446 H
  "2025-06-27", // Tahun Baru Islam 1447 H
  "2025-08-17", // Hari Kemerdekaan RI
  "2025-09-05", // Maulid Nabi Muhammad SAW
  "2025-12-25", // Hari Raya Natal
  "2025-12-26", // Cuti Bersama Hari Raya Natal

  // 2026 Holidays
  "2026-01-01", // Tahun Baru Masehi
  "2026-01-15", // Isra Mi'raj Nabi Muhammad SAW (perkiraan)
  "2026-02-17", // Tahun Baru Imlek
  "2026-03-19", // Hari Raya Nyepi
  "2026-03-20", // Hari Raya Idul Fitri 1447 H (perkiraan)
  "2026-03-21", // Hari Raya Idul Fitri 1447 H (perkiraan)
  "2026-04-03", // Wafat Isa Almasih / Jumat Agung
  "2026-05-01", // Hari Buruh Internasional
  "2026-05-27", // Hari Raya Idul Adha 1447 H (perkiraan)
  "2026-06-01", // Hari Lahir Pancasila
  "2026-06-16", // Tahun Baru Islam 1448 H (perkiraan)
  "2026-08-17", // Hari Kemerdekaan RI
  "2026-08-25", // Maulid Nabi Muhammad SAW (perkiraan)
  "2026-12-25", // Hari Raya Natal
  "2026-12-26", // Cuti Bersama Hari Raya Natal

  // 2027 Holidays
  "2027-01-01", // Tahun Baru Masehi
  "2027-01-05", // Isra Mi'raj Nabi Muhammad SAW (perkiraan)
  "2027-02-06", // Tahun Baru Imlek
  "2027-03-09", // Hari Raya Nyepi
  "2027-03-09", // Hari Raya Idul Fitri 1448 H (perkiraan)
  "2027-03-10", // Hari Raya Idul Fitri 1448 H (perkiraan)
  "2027-03-26", // Wafat Isa Almasih / Jumat Agung
  "2027-05-01", // Hari Buruh Internasional
  "2027-05-16", // Hari Raya Idul Adha 1448 H (perkiraan)
  "2027-06-01", // Hari Lahir Pancasila
  "2027-06-05", // Tahun Baru Islam 1449 H (perkiraan)
  "2027-08-17", // Hari Kemerdekaan RI
  "2027-08-14", // Maulid Nabi Muhammad SAW (perkiraan)
  "2027-12-25", // Hari Raya Natal
  "2027-12-26", // Cuti Bersama Hari Raya Natal
]);

/**
 * Memeriksa apakah suatu tanggal jatuh pada Hari Minggu atau Hari Libur Nasional
 */
export function isHolidayOrSunday(date: Date): boolean {
  // 1. Cek apakah Hari Minggu (getDay() === 0)
  if (date.getDay() === 0) {
    return true;
  }

  // 2. Format tanggal ke YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // 3. Cek apakah ada di dalam daftar Hari Libur
  return INDONESIAN_HOLIDAYS.has(dateStr);
}

/**
 * Menghitung jumlah hari cuti riil antara dua tanggal.
 * Mengabaikan Hari Minggu dan Hari Libur Nasional.
 * Diposisikan di sini agar bisa digunakan baik di Server (API) maupun Client (UI).
 */
export function calculateLeaveDays(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set waktu ke tengah hari untuk menghindari isu timezone/DST
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  if (end < start) return 0;

  let activeDays = 0;
  const current = new Date(start);

  while (current <= end) {
    if (!isHolidayOrSunday(current)) {
      activeDays++;
    }
    // Tambah 1 hari
    current.setDate(current.getDate() + 1);
  }

  return activeDays;
}
