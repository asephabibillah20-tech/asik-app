/**
 * Menghitung akumulasi kuota Cuti Panjang (45 hari per kelipatan 6 tahun kerja)
 * dihitung dari tanggal pengangkatan (hireDate).
 */
export function calculateLongLeave(hireDate: Date | string): number {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - new Date(hireDate).getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  
  if (diffYears >= 6) {
    const periody = Math.floor(diffYears / 6);
    return periody * 45; // Mengembalikan total akumulasi lifetime
  }
  return 0;
}
