"use client";

import { useEffect, useState } from "react";
import BadgeStatus from "@/components/ui/BadgeStatus";

interface UserProfile {
  id: string;
  nik: string;
  name: string;
  role: string;
  position: string;
  department: string;
  joinedAt: string;
  hireDate: string;
  leaveAnnual: number;
  leaveLong: number;
}

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  leaveType: string;
  isBorrowed: boolean;
  status: string;
  createdAt: string;
}

export default function KaryawanDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk form pengajuan cuti
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    leaveType: "TAHUNAN",
    reason: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [borrowWarning, setBorrowWarning] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Fetch data
  const fetchData = async () => {
    try {
      const [resProfile, resLeaves] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/leaves"),
      ]);

      const dataProfile = await resProfile.json();
      const dataLeaves = await resLeaves.json();

      if (resProfile.ok) setProfile(dataProfile.user);
      if (resLeaves.ok) setLeaves(dataLeaves.leaves || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hitung durasi cuti secara dinamis dan tentukan warning Pinjam Cuti
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = end.getTime() - start.getTime();
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(totalDays);

        if (profile) {
          const quota = formData.leaveType === "TAHUNAN" ? profile.leaveAnnual : profile.leaveLong;
          setBorrowWarning(quota < totalDays);
        }
      } else {
        setCalculatedDays(0);
        setBorrowWarning(false);
      }
    } else {
      setCalculatedDays(0);
      setBorrowWarning(false);
    }
  }, [formData.startDate, formData.endDate, formData.leaveType, profile]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowFormModal(false);
        setFormData({
          startDate: "",
          endDate: "",
          leaveType: "TAHUNAN",
          reason: "",
        });
        fetchData();
      } else {
        setFormError(data.error || "Gagal mengajukan cuti");
      }
    } catch (err) {
      setFormError("Gagal menyambung ke server");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Hitung masa kerja
  const getMasaKerja = (dateStr: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    return `${diffYears} Tahun ${diffMonths} Bulan`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profil Karyawan & Ringkasan Saldo Cuti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Profil */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500 text-slate-900 font-bold flex items-center justify-center text-xl rounded-xl">
                👤
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{profile?.name}</h3>
                <p className="text-xs text-slate-400 font-mono">NIK: {profile?.nik}</p>
              </div>
            </div>
            <div className="space-y-2.5 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Jabatan</span>
                <span className="font-semibold text-slate-800">{profile?.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Departemen</span>
                <span className="font-semibold text-slate-800">{profile?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Tanggal Pengangkatan</span>
                <span className="font-semibold text-slate-800">
                  {profile && new Date(profile.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Masa Kerja</span>
                <span className="font-semibold text-slate-800">{profile && getMasaKerja(profile.hireDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quota Tahunan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 rounded uppercase">
              Cuti Tahunan
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold ${profile && profile.leaveAnnual < 0 ? "text-rose-600" : "text-slate-800"}`}>
                {profile?.leaveAnnual}
              </span>
              <span className="text-slate-400 font-medium text-sm">Hari Sisa</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Kuota Cuti Tahunan reguler 12 hari/tahun.</p>
          </div>
          {profile && profile.leaveAnnual < 0 && (
            <div className="mt-4 bg-rose-50 text-rose-700 text-xs p-2.5 rounded-lg border border-rose-100 font-medium">
              ⚠️ Saldo minus! Anda sedang dalam skema <strong>Pinjam Cuti</strong>.
            </div>
          )}
        </div>

        {/* Quota Panjang */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-purple-700 bg-purple-50 rounded uppercase">
              Cuti Panjang
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold ${profile && profile.leaveLong < 0 ? "text-rose-600" : "text-slate-800"}`}>
                {profile?.leaveLong}
              </span>
              <span className="text-slate-400 font-medium text-sm">Hari Sisa</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Cuti panjang 45 hari otomatis setiap kelipatan 6 tahun kerja.</p>
          </div>
          {profile && profile.leaveLong < 0 && (
            <div className="mt-4 bg-rose-50 text-rose-700 text-xs p-2.5 rounded-lg border border-rose-100 font-medium">
              ⚠️ Saldo minus! Anda sedang dalam skema <strong>Pinjam Cuti</strong>.
            </div>
          )}
        </div>
      </div>

      {/* Daftar Pengajuan & Tombol Aksi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="text-sm font-bold text-slate-700">Riwayat Pengajuan Cuti Anda</h4>
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
          >
            ➕ Ajukan Cuti
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Tipe Cuti</th>
                <th className="px-6 py-4">Tanggal Mulai</th>
                <th className="px-6 py-4">Tanggal Selesai</th>
                <th className="px-6 py-4">Jumlah Hari</th>
                <th className="px-6 py-4">Alasan</th>
                <th className="px-6 py-4">Tanggal Pengajuan</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada pengajuan cuti. Silakan gunakan tombol "Ajukan Cuti".
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-bold tracking-wide rounded ${
                        leave.leaveType === "TAHUNAN" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(leave.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(leave.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 font-semibold">{leave.totalDays} Hari</td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(leave.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4">
                      <BadgeStatus status={leave.status} isBorrowed={leave.isBorrowed} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajukan Cuti */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Form Pengajuan Cuti Baru</h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipe Cuti
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="TAHUNAN">TAHUNAN (Sisa: {profile?.leaveAnnual} Hari)</option>
                  <option value="PANJANG">PANJANG (Sisa: {profile?.leaveLong} Hari)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Selesai Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {calculatedDays > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 text-xs flex justify-between items-center">
                  <span>Durasi Cuti:</span>
                  <span className="font-bold text-sm text-slate-900">{calculatedDays} Hari Kerja</span>
                </div>
              )}

              {borrowWarning && calculatedDays > 0 && (
                <div className="bg-purple-50 text-purple-800 text-xs p-3 rounded-xl border border-purple-100 font-medium">
                  💡 <strong>Informasi Pinjam Cuti:</strong> Jumlah hari cuti yang diminta melebihi sisa kuota Anda. Jika disetujui, pengajuan ini akan ditandai sebagai <strong>Pinjam Cuti</strong> dan kuota Anda akan bernilai minus (negatif).
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alasan Cuti
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan alasan pengajuan cuti Anda..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-2"
                >
                  {formLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
