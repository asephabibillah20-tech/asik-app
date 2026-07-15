"use client";

import React, { useEffect, useState } from "react";
import BadgeStatus from "@/components/ui/BadgeStatus";
import { calculateLeaveDays } from "@/utils/holidays";

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
  contractType?: string;
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
  approvedByName?: string | null;
  approvedByPosition?: string | null;
  approvedByNik?: string | null;
}

export default function KaryawanDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk client-side pagination
  const [myLeavesPage, setMyLeavesPage] = useState(1);
  const [memberLeavesPage, setMemberLeavesPage] = useState(1);

  // State Portal untuk PIMPINAN (Persetujuan Cuti Anggota)
  const [activePortalTab, setActivePortalTab] = useState<"my-dashboard" | "member-leaves">("my-dashboard");
  const [memberLeaves, setMemberLeaves] = useState<any[]>([]);
  const [memberSearchName, setMemberSearchName] = useState("");
  const [memberFilterStatus, setMemberFilterStatus] = useState("PENDING");
  const [memberLoading, setMemberLoading] = useState(false);

  // Reset page ke 1 saat filter berubah
  useEffect(() => {
    setMemberLeavesPage(1);
  }, [memberSearchName, memberFilterStatus]);

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

      if (resProfile.ok) {
        setProfile(dataProfile.user);
        if (dataProfile.user.role === "PIMPINAN") {
          // Fetch member leaves on init to update badges
          const resMember = await fetch("/api/leaves?dept=true");
          if (resMember.ok) {
            const dataMember = await resMember.json();
            setMemberLeaves(dataMember.leaves || []);
          }
        }
      }
      if (resLeaves.ok) setLeaves(dataLeaves.leaves || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberLeaves = async () => {
    setMemberLoading(true);
    try {
      const res = await fetch("/api/leaves?dept=true");
      if (res.ok) {
        const data = await res.json();
        setMemberLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error("Gagal memuat cuti anggota:", err);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleDbUpdate = () => {
      fetchData();
      if (activePortalTab === "member-leaves") {
        fetchMemberLeaves();
      }
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => {
      window.removeEventListener("db-update", handleDbUpdate);
    };
  }, [activePortalTab]);

  useEffect(() => {
    if (activePortalTab === "member-leaves") {
      fetchMemberLeaves();
    }
  }, [activePortalTab]);

  // Hitung durasi cuti secara dinamis dan tentukan warning Pinjam Cuti
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const totalDays = calculateLeaveDays(formData.startDate, formData.endDate);
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

  const handlePrintLeave = (leave: Leave) => {
    if (!profile) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pencetakan. Silakan izinkan popup.");
      return;
    }

    const startDateStr = new Date(leave.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const endDateStr = new Date(leave.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const printDateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    printWindow.document.write(`
      <html>
        <head>
          <title>Surat Izin Cuti - ${profile.name}</title>
          <style>
            @page {
              size: A4;
              margin: 12mm 15mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
              background-color: #fff;
              margin: 0;
              padding: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-bottom: 15px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            .header-left {
              text-align: left;
            }
            .header-left h2 {
              margin: 0;
              font-size: 14pt;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header-left p {
              margin: 3px 0 0 0;
              font-size: 9pt;
              color: #555;
            }
            .header-right {
              text-align: right;
              font-weight: bold;
              font-size: 10pt;
              color: #000;
              text-transform: uppercase;
              border: 1.5px solid #000;
              padding: 3px 8px;
              border-radius: 4px;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }
            .title {
              text-align: center;
              font-size: 13pt;
              font-weight: bold;
              text-decoration: underline;
              text-transform: uppercase;
              margin-bottom: 15px;
            }
            .content-text {
              margin-bottom: 15px;
              text-align: justify;
            }
            .table-info {
              width: 100%;
              margin-bottom: 15px;
              border-collapse: collapse;
            }
            .table-info td {
              padding: 4px 0;
              vertical-align: top;
            }
            .table-info td.label {
              width: 30%;
            }
            .table-info td.colon {
              width: 3%;
            }
            .signature-container {
              width: 100%;
              margin-top: 30px;
              display: table;
              page-break-inside: avoid;
            }
            .signature-box {
              display: table-cell;
              width: 50%;
              text-align: center;
            }
            .signature-box p {
              margin: 0;
              padding: 0;
            }
            .signature-space {
              height: 50px;
            }
            .signature-name {
              font-weight: bold;
              text-decoration: underline;
            }
            @media print {
              body {
                background-color: #fff;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h2>PKS AUR GADING</h2>
              <p>Aplikasi Sistem Informasi Karyawan PKS Aur Gading (ASIK PAG)</p>
            </div>
            <div class="header-right">
              Surat Izin Cuti
            </div>
          </div>
          
          <div class="title">SURAT PERSETUJUAN IZIN CUTI</div>
          
          <div class="content-text">
            Yang bertanda tangan di bawah ini, menerangkan bahwa pengajuan izin cuti karyawan berikut telah disetujui:
          </div>
          
          <table class="table-info">
            <tr>
              <td class="label">Nama Karyawan</td>
              <td class="colon">:</td>
              <td><strong>${profile.name}</strong></td>
            </tr>
            <tr>
              <td class="label">NIK (Nomor Induk)</td>
              <td class="colon">:</td>
              <td>${profile.nik}</td>
            </tr>
            <tr>
              <td class="label">Jabatan / Posisi</td>
              <td class="colon">:</td>
              <td>${profile.position}</td>
            </tr>
            <tr>
              <td class="label">Departemen</td>
              <td class="colon">:</td>
              <td>${profile.department}</td>
            </tr>
            <tr>
              <td class="label">Jenis Cuti</td>
              <td class="colon">:</td>
              <td>Cuti ${leave.leaveType === "TAHUNAN" ? "Tahunan" : "Panjang"}</td>
            </tr>
            <tr>
              <td class="label">Tanggal Pelaksanaan</td>
              <td class="colon">:</td>
              <td>${startDateStr} s/d ${endDateStr}</td>
            </tr>
            <tr>
              <td class="label">Durasi Cuti</td>
              <td class="colon">:</td>
              <td><strong>${leave.totalDays} Hari Kerja</strong></td>
            </tr>
            <tr>
              <td class="label">Alasan Cuti</td>
              <td class="colon">:</td>
              <td>${leave.reason}</td>
            </tr>
            <tr>
              <td class="label">Status Pengajuan</td>
              <td class="colon">:</td>
              <td><strong>${leave.status}</strong></td>
            </tr>
            <tr>
              <td class="label">Skema Pinjam Cuti</td>
              <td class="colon">:</td>
              <td>${leave.isBorrowed ? "Ya (Pinjam Kuota)" : "Tidak"}</td>
            </tr>
            <tr>
              <td class="label">Sisa Cuti Tahunan</td>
              <td class="colon">:</td>
              <td>${profile?.leaveAnnual} Hari</td>
            </tr>
            ${profile?.contractType !== "PKWT" ? `
            <tr>
              <td class="label">Sisa Cuti Panjang</td>
              <td class="colon">:</td>
              <td>${profile?.leaveLong} Hari</td>
            </tr>
            ` : ""}
          </table>
          
          <div class="content-text">
            Demikian surat izin cuti ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
          </div>
          
          <div class="signature-container">
            <div class="signature-box">
              <p>&nbsp;</p>
              <p>Pemohon (Karyawan),</p>
              <p>&nbsp;</p>
              <div class="signature-space"></div>
              <p class="signature-name">${profile?.name}</p>
              <p>NIK: ${profile?.nik}</p>
            </div>
            <div class="signature-box">
              <p>Aur Gading, ${printDateStr}</p>
              <p>Mengetahui / Menyetujui,<br/>${leave.approvedByPosition || "HRD / Pimpinan"}</p>
              <div class="signature-space"></div>
              <p class="signature-name">${leave.approvedByName || "Budi Santoso"}</p>
              <p>${leave.approvedByNik ? `NIK: ${leave.approvedByNik}` : (leave.approvedByPosition || "HR Administrator")}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  const filteredMemberLeaves = memberLeaves.filter((l) => {
    const nameMatch = l.employee?.name.toLowerCase().includes(memberSearchName.toLowerCase()) || 
                     l.employee?.nik.includes(memberSearchName);
    const statusMatch = memberFilterStatus === "ALL" || l.status === memberFilterStatus;
    return nameMatch && statusMatch;
  });

  const myLeavesTotalPages = Math.ceil(leaves.length / 50);
  const memberLeavesTotalPages = Math.ceil(filteredMemberLeaves.length / 50);

  const paginatedMyLeaves = leaves.slice((myLeavesPage - 1) * 50, myLeavesPage * 50);
  const paginatedMemberLeaves = filteredMemberLeaves.slice((memberLeavesPage - 1) * 50, memberLeavesPage * 50);

  const handleApproveMember = async (id: string) => {
    if (!confirm("Apakah Anda yakin menyetujui pengajuan cuti ini?")) return;
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchMemberLeaves();
      } else {
        alert(data.error || "Gagal menyetujui pengajuan");
      }
    } catch (err) {
      alert("Gagal menyambung ke server");
    }
  };

  const handleRejectMember = async (id: string) => {
    if (!confirm("Apakah Anda yakin menolak pengajuan cuti ini?")) return;
    try {
      const res = await fetch(`/api/leaves/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchMemberLeaves();
      } else {
        alert(data.error || "Gagal menolak pengajuan");
      }
    } catch (err) {
      alert("Gagal menyambung ke server");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Portal Tab Navigation for PIMPINAN role */}
      {profile?.role === "PIMPINAN" && (
        <div className="flex border-b border-slate-200 mb-2">
          <button
            onClick={() => setActivePortalTab("my-dashboard")}
            className={`px-6 py-3 border-b-2 font-medium text-sm transition-all duration-150 cursor-pointer ${
              activePortalTab === "my-dashboard"
                ? "border-emerald-500 text-emerald-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            👤 Dashboard Cuti Saya
          </button>
          <button
            onClick={() => setActivePortalTab("member-leaves")}
            className={`px-6 py-3 border-b-2 font-medium text-sm transition-all duration-150 cursor-pointer ${
              activePortalTab === "member-leaves"
                ? "border-emerald-500 text-emerald-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            📋 Persetujuan Cuti Bagian ({memberLeaves.filter(l => l.status === "PENDING").length})
          </button>
        </div>
      )}

      {activePortalTab === "my-dashboard" && (
        <div className="space-y-8">
      {/* Profil Karyawan & Ringkasan Saldo Cuti */}
      <div className={`grid grid-cols-1 ${profile?.contractType === "PKWT" ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-6`}>
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
            <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
              <div>
                <span className="text-slate-400 text-xs font-semibold block mb-0.5">Jabatan</span>
                <span className="font-bold text-slate-800 text-sm">{profile?.position}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs font-semibold block mb-0.5">Departemen</span>
                <span className="font-bold text-slate-800 text-sm leading-relaxed">{profile?.department}</span>
              </div>
              {profile?.contractType === "PKWT" ? (
                <>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block mb-0.5">Tanggal Mulai Kontrak</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {profile && new Date(profile.joinedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block mb-0.5">Tanggal Akhir Kontrak</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {profile && new Date(profile.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block mb-0.5">Masa Kontrak Berjalan</span>
                    <span className="font-bold text-slate-800 text-sm">{profile && getMasaKerja(profile.joinedAt)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block mb-0.5">Tanggal Pengangkatan</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {profile && new Date(profile.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block mb-0.5">Masa Kerja</span>
                    <span className="font-bold text-slate-800 text-sm">{profile && getMasaKerja(profile.hireDate)}</span>
                  </div>
                </>
              )}
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
        {profile?.contractType !== "PKWT" && (
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
        )}
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
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Belum ada pengajuan cuti. Silakan gunakan tombol "Ajukan Cuti".
                  </td>
                </tr>
              ) : (
                    paginatedMyLeaves.map((leave) => (
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
                        <td className="px-6 py-4 text-right">
                          {leave.status === "APPROVED" ? (
                            <button
                              onClick={() => handlePrintLeave(leave)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-xs ml-auto"
                              title="Cetak Surat Cuti"
                            >
                              🖨️ Cetak
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar for My Leaves */}
            {myLeavesTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan halaman <span className="font-bold text-slate-700">{myLeavesPage}</span> dari <span className="font-bold text-slate-700">{myLeavesTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{leaves.length}</span> data)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMyLeavesPage(prev => Math.max(prev - 1, 1))}
                    disabled={myLeavesPage === 1}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      myLeavesPage === 1
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                    }`}
                  >
                    ⬅️ Sebelumnya
                  </button>

                  {Array.from({ length: myLeavesTotalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === myLeavesTotalPages || Math.abs(page - myLeavesPage) <= 1)
                    .map((page, index, arr) => {
                      const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                          <button
                            onClick={() => setMyLeavesPage(page)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              myLeavesPage === page
                                ? "bg-emerald-500 text-slate-900 shadow-sm shadow-emerald-500/10 cursor-pointer"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => setMyLeavesPage(prev => Math.min(prev + 1, myLeavesTotalPages))}
                    disabled={myLeavesPage === myLeavesTotalPages}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      myLeavesPage === myLeavesTotalPages
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                    }`}
                  >
                    Selanjutnya ➡️
                  </button>
                </div>
              </div>
            )}
      </div>
    </div>
  )}

      {activePortalTab === "member-leaves" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          {/* Header Action */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700">
              Persetujuan Cuti Karyawan Pelaksana - {profile?.department}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Sebagai Pimpinan Bagian, Anda berhak menyetujui atau menolak permohonan cuti dari staf pelaksana di bagian Anda.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Cari Karyawan:</span>
                <input
                  type="text"
                  placeholder="Nama / NIK..."
                  value={memberSearchName}
                  onChange={(e) => setMemberSearchName(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors w-44"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                <select
                  value={memberFilterStatus}
                  onChange={(e) => setMemberFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="ALL">Semua</option>
                  <option value="PENDING">Menunggu Persetujuan</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="REJECTED">Ditolak</option>
                </select>
              </div>
              {(memberSearchName || memberFilterStatus !== "PENDING") && (
                <button
                  onClick={() => {
                    setMemberSearchName("");
                    setMemberFilterStatus("PENDING");
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Menampilkan <span className="font-bold text-slate-700">{filteredMemberLeaves.length}</span> pengajuan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Karyawan</th>
                  <th className="px-6 py-4">Tipe Cuti</th>
                  <th className="px-6 py-4">Tanggal Mulai</th>
                  <th className="px-6 py-4">Tanggal Selesai</th>
                  <th className="px-6 py-4">Jumlah Hari</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {memberLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-slate-400">Memuat...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMemberLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Tidak ada pengajuan cuti yang sesuai.
                    </td>
                  </tr>
                ) : (
                  paginatedMemberLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{leave.employee?.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">NIK: {leave.employee?.nik}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{leave.employee?.position}</div>
                        <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                          Sisa Cuti: Tahunan {leave.employee?.leaveAnnual} Hari
                          {leave.employee?.contractType !== "PKWT" && ` | Panjang ${leave.employee?.leaveLong} Hari`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          leave.leaveType === "TAHUNAN" 
                            ? "text-blue-700 bg-blue-50" 
                            : "text-purple-700 bg-purple-50"
                        }`}>
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(leave.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(leave.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{leave.totalDays} Hari</td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="px-6 py-4">
                        <BadgeStatus status={leave.status} isBorrowed={leave.isBorrowed} />
                        {leave.isBorrowed && leave.status === "APPROVED" && (
                          <div className="text-[9px] text-amber-600 font-semibold mt-1">💸 PINJAM CUTI</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveMember(leave.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleRejectMember(leave.id)}
                              className="bg-rose-50 hover:bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Selesai diproses</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar for Member Leaves */}
          {memberLeavesTotalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div className="text-xs text-slate-500 font-medium">
                Menampilkan halaman <span className="font-bold text-slate-700">{memberLeavesPage}</span> dari <span className="font-bold text-slate-700">{memberLeavesTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{filteredMemberLeaves.length}</span> data)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMemberLeavesPage(prev => Math.max(prev - 1, 1))}
                  disabled={memberLeavesPage === 1}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    memberLeavesPage === 1
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                  }`}
                >
                  ⬅️ Sebelumnya
                </button>

                {Array.from({ length: memberLeavesTotalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === memberLeavesTotalPages || Math.abs(page - memberLeavesPage) <= 1)
                  .map((page, index, arr) => {
                    const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                        <button
                          onClick={() => setMemberLeavesPage(page)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            memberLeavesPage === page
                              ? "bg-emerald-500 text-slate-900 shadow-sm shadow-emerald-500/10 cursor-pointer"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setMemberLeavesPage(prev => Math.min(prev + 1, memberLeavesTotalPages))}
                  disabled={memberLeavesPage === memberLeavesTotalPages}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    memberLeavesPage === memberLeavesTotalPages
                      ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                  }`}
                >
                  Selanjutnya ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                {profile?.contractType === "PKWT" ? (
                  <select
                    disabled
                    value="TAHUNAN"
                    className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-sm px-3.5 py-2.5 rounded-xl outline-none"
                  >
                    <option value="TAHUNAN">TAHUNAN (Sisa: {profile?.leaveAnnual} Hari)</option>
                  </select>
                ) : (
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="TAHUNAN">TAHUNAN (Sisa: {profile?.leaveAnnual} Hari)</option>
                    <option value="PANJANG">PANJANG (Sisa: {profile?.leaveLong} Hari)</option>
                  </select>
                )}
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
