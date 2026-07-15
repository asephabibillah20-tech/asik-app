"use client";

import React, { useEffect, useState } from "react";
import BadgeStatus from "@/components/ui/BadgeStatus";
import { useAdmin } from "./AdminContext";

interface Employee {
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
  status: string;
  contractType?: string;
}

const BadgeEmployeeStatus = ({ status }: { status: string }) => {
  switch (status) {
    case "AKTIF":
      return <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide rounded bg-emerald-100 text-emerald-800">Aktif</span>;
    case "TIDAK_AKTIF":
      return <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide rounded bg-slate-100 text-slate-800">Tidak Aktif</span>;
    case "PENSIUN":
      return <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide rounded bg-blue-100 text-blue-800">Pensiun</span>;
    case "PTDH":
      return <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide rounded bg-rose-100 text-rose-800" title="Pemberhentian Tidak Dengan Hormat">PTDH</span>;
    default:
      return <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide rounded bg-slate-100 text-slate-800">{status}</span>;
  }
};

interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  leaveType: string;
  isBorrowed: boolean;
  status: string;
  approvedByName?: string | null;
  approvedByPosition?: string | null;
  approvedByNik?: string | null;
  createdAt: string;
  employee: {
    nik: string;
    name: string;
    position: string;
    department: string;
    leaveAnnual: number;
    leaveLong: number;
    contractType?: string;
  };
}

export default function AdminDashboard() {
  const { activeTab, setActiveTab, setCounts } = useAdmin();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State untuk filter tanggal
  const [leavesFilterStart, setLeavesFilterStart] = useState("");
  const [leavesFilterEnd, setLeavesFilterEnd] = useState("");
  const [leavesSearchName, setLeavesSearchName] = useState("");
  const [leavesFilterStatus, setLeavesFilterStatus] = useState("ALL");
  const [logsFilterStart, setLogsFilterStart] = useState("");
  const [logsFilterEnd, setLogsFilterEnd] = useState("");

  // State untuk log pagination
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  // States untuk client-side pagination
  const [leavesPage, setLeavesPage] = useState(1);
  const [pkwttPage, setPkwttPage] = useState(1);
  const [pkwtPage, setPkwtPage] = useState(1);
  const [adminPage, setAdminPage] = useState(1);

  // State untuk pencarian nama & filter status keaktifan
  const [empSearchName, setEmpSearchName] = useState("");
  const [empFilterStatus, setEmpFilterStatus] = useState("ALL");
  const [pkwtSearchName, setPkwtSearchName] = useState("");
  const [pkwtFilterStatus, setPkwtFilterStatus] = useState("ALL");
  const [adminSearchName, setAdminSearchName] = useState("");
  const [adminFilterStatus, setAdminFilterStatus] = useState("ALL");

  // Reset page ke 1 saat filter berubah
  useEffect(() => {
    setLeavesPage(1);
  }, [leavesSearchName, leavesFilterStatus, leavesFilterStart, leavesFilterEnd]);

  useEffect(() => {
    setPkwttPage(1);
  }, [empSearchName, empFilterStatus]);

  useEffect(() => {
    setPkwtPage(1);
  }, [pkwtSearchName, pkwtFilterStatus]);

  useEffect(() => {
    setAdminPage(1);
  }, [adminSearchName, adminFilterStatus]);

  // State untuk form tambah/edit karyawan
  const [showModal, setShowModal] = useState<"add" | "edit" | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    password: "",
    role: "KARYAWAN",
    position: "",
    department: "",
    joinedAt: "",
    hireDate: "",
    leaveAnnual: "12",
    leaveLong: "0",
    status: "AKTIF",
    contractType: "PKWTT",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // States untuk batch import karyawan
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resEmp, resLeaves, resLogs, resMe] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/leaves"),
        fetch(`/api/admin/login-logs?page=${logsPage}&limit=50`),
        fetch("/api/auth/me"),
      ]);

      const dataEmp = await resEmp.json();
      const dataLeaves = await resLeaves.json();
      const dataLogs = await resLogs.json();
      const dataMe = await resMe.json();

      if (resEmp.ok) setEmployees(dataEmp.employees || []);
      if (resLeaves.ok) setLeaves(dataLeaves.leaves || []);
      if (resLogs.ok) {
        setLoginLogs(dataLogs.logs || []);
        setLogsTotalPages(dataLogs.totalPages || 1);
        setLogsTotal(dataLogs.totalLogs || 0);
      }
      if (resMe.ok) setCurrentUser(dataMe.user || null);

      const employeesList = dataEmp.employees || [];
      const leavesList = dataLeaves.leaves || [];
      const logsTotalCount = dataLogs.totalLogs || 0;

      const pkwtt = employeesList.filter((e: any) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && (e.contractType === "PKWTT" || !e.contractType)).length;
      const pkwt = employeesList.filter((e: any) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.contractType === "PKWT").length;
      const admins = employeesList.filter((e: any) => e.role === "ADMIN").length;

      setCounts({
        leaves: leavesList.length,
        pkwtt,
        pkwt,
        admins,
        logs: logsTotalCount,
      });
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleDbUpdate = () => {
      fetchData();
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => {
      window.removeEventListener("db-update", handleDbUpdate);
    };
  }, [logsPage]);

  // Handle Approve Cuti
  const handleApprove = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menyetujui pengajuan cuti ini?")) return;
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Gagal menyetujui cuti:", err);
    }
  };

  // Handle Reject Cuti
  const handleReject = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menolak pengajuan cuti ini?")) return;
    try {
      const res = await fetch(`/api/leaves/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Gagal menolak cuti:", err);
    }
  };

  // Handle Hapus Pengajuan Cuti
  const handleDeleteLeave = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengajuan cuti ini? Saldo cuti karyawan akan dihitung ulang secara otomatis.")) return;
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Gagal menghapus pengajuan cuti:", err);
    }
  };

  // Handle Hapus Semua Log Login
  const handleClearAllLogs = async () => {
    if (!confirm("Apakah Anda yakin ingin mengosongkan semua log aktivitas login?")) return;
    try {
      const res = await fetch("/api/admin/login-logs", {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Gagal mengosongkan log login:", err);
    }
  };

  // Handle Hapus Satu Baris Log Login
  const handleDeleteLog = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus log aktivitas login ini?")) return;
    try {
      const res = await fetch(`/api/admin/login-logs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Gagal menghapus log login:", err);
    }
  };

  // Handle Delete Karyawan
  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus karyawan ini? Data pengajuan cuti terkait juga akan terhapus.")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Gagal menghapus karyawan:", err);
    }
  };

  // Handle submit form (Add/Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    const isEdit = showModal === "edit";
    const url = isEdit ? `/api/employees/${selectedEmployee?.id}` : "/api/employees";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowModal(null);
        setSelectedEmployee(null);
        fetchData();
      } else {
        setFormError(data.error || "Gagal menyimpan data");
      }
    } catch (err) {
      setFormError("Gagal menyambung ke server");
    } finally {
      setFormLoading(false);
    }
  };

  // Fungsi untuk mengunduh berkas templat CSV
  const downloadTemplateCSV = () => {
    const headers = [
      "NIK",
      "Nama",
      "Password",
      "Role (PELAKSANA/PIMPINAN/ADMIN)",
      "Jabatan",
      "Departemen",
      "Tanggal Masuk (YYYY-MM-DD)",
      "Tanggal Pengangkatan (YYYY-MM-DD)",
      "Tipe Kontrak (PKWTT/PKWT)",
      "Status (AKTIF/TIDAK_AKTIF/PENSIUN/PTDH)"
    ];
    const sampleData = [
      [
        "660901",
        "Ahmad Fauzi",
        "fauzi123",
        "PELAKSANA",
        "Operator Boiler",
        "BAGIAN PENGOLAHAN SHIFT 1",
        "2020-05-12",
        "2020-05-12",
        "PKWTT",
        "AKTIF"
      ],
      [
        "660902",
        "Dewi Lestari",
        "dewi123",
        "PIMPINAN",
        "Asisten Personalia",
        "BAGIAN TATA USAHA & PERSONALIA UMUM",
        "2018-02-15",
        "2018-02-15",
        "PKWTT",
        "AKTIF"
      ]
    ];

    const csvContent = [
      headers.join(";"),
      ...sampleData.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "templat_import_karyawan.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler pengunggahan dan parsing file CSV di sisi client
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          setImportError("Berkas CSV kosong atau tidak memiliki data.");
          return;
        }

        const headerLine = lines[0];
        const separator = headerLine.includes(";") ? ";" : ",";
        const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ""));

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(separator).map(val => val.trim().replace(/^["']|["']$/g, ""));
          if (values.length < headers.length) continue;

          const record: any = {};
          headers.forEach((header, idx) => {
            let cleanHeader = header.toLowerCase();
            if (cleanHeader.includes("nik")) cleanHeader = "nik";
            else if (cleanHeader.includes("nama")) cleanHeader = "name";
            else if (cleanHeader.includes("password")) cleanHeader = "password";
            else if (cleanHeader.includes("role")) cleanHeader = "role";
            else if (cleanHeader.includes("jabatan")) cleanHeader = "position";
            else if (cleanHeader.includes("departemen")) cleanHeader = "department";
            else if (cleanHeader.includes("masuk")) cleanHeader = "joinedAt";
            else if (cleanHeader.includes("pengangkatan")) cleanHeader = "hireDate";
            else if (cleanHeader.includes("kontrak")) cleanHeader = "contractType";
            else if (cleanHeader.includes("status")) cleanHeader = "status";

            record[cleanHeader] = values[idx] || "";
          });

          // Normalisasi value
          if (record.role) {
            const roleUpper = record.role.toUpperCase();
            if (roleUpper.includes("PELAKSANA")) record.role = "PELAKSANA";
            else if (roleUpper.includes("PIMPINAN")) record.role = "PIMPINAN";
            else if (roleUpper.includes("ADMIN")) record.role = "ADMIN";
          }
          if (record.contracttype) {
            record.contractType = record.contracttype;
            delete record.contracttype;
          }
          if (record.contractType) {
            const cTypeUpper = record.contractType.toUpperCase();
            if (cTypeUpper.includes("PKWTT")) record.contractType = "PKWTT";
            else if (cTypeUpper.includes("PKWT")) record.contractType = "PKWT";
          }
          if (record.status) {
            const statusUpper = record.status.toUpperCase();
            if (statusUpper.includes("AKTIF") && !statusUpper.includes("TIDAK")) record.status = "AKTIF";
            else if (statusUpper.includes("TIDAK_AKTIF") || statusUpper.includes("TIDAK AKTIF")) record.status = "TIDAK_AKTIF";
            else if (statusUpper.includes("PENSIUN")) record.status = "PENSIUN";
            else if (statusUpper.includes("PTDH")) record.status = "PTDH";
          }

          // Normalisasi format tanggal: DD/MM/YYYY atau DD-MM-YYYY → YYYY-MM-DD
          const normalizeDate = (raw: string): string => {
            if (!raw) return "";
            // Sudah format YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
            // Format DD/MM/YYYY atau DD-MM-YYYY
            const match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (match) {
              const [, day, month, year] = match;
              return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
            // Format M/D/YYYY (Amerika) → cek apakah sudah YYYY di akhir
            const matchAlt = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
            if (matchAlt) {
              const [, day, month, year] = matchAlt;
              const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
              return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
            return raw;
          };

          if (record.joinedAt) record.joinedAt = normalizeDate(record.joinedAt);
          if (record.hireDate) record.hireDate = normalizeDate(record.hireDate);

          // Validasi Klien
          const validationErrors: string[] = [];
          if (!record.nik) validationErrors.push("NIK wajib diisi");
          if (!record.name) validationErrors.push("Nama wajib diisi");
          if (!record.password) validationErrors.push("Password wajib diisi");
          if (!record.position) validationErrors.push("Jabatan wajib diisi");
          if (!record.department) validationErrors.push("Departemen wajib diisi");
          if (!record.joinedAt || isNaN(Date.parse(record.joinedAt))) validationErrors.push("Format Tanggal Masuk tidak valid (pastikan format DD/MM/YYYY atau YYYY-MM-DD)");
          if (!record.hireDate || isNaN(Date.parse(record.hireDate))) validationErrors.push("Format Tanggal Pengangkatan tidak valid (pastikan format DD/MM/YYYY atau YYYY-MM-DD)");

          // Cek duplikasi di file sendiri
          const isDuplicateInFile = rows.some(r => r.nik === record.nik);
          if (isDuplicateInFile) {
            validationErrors.push("NIK ganda dalam berkas");
          }

          // Cek duplikasi di database
          const isDuplicateInDb = employees.some(emp => emp.nik === record.nik);
          if (isDuplicateInDb) {
            validationErrors.push("NIK sudah terdaftar di database");
          }

          record.validationErrors = validationErrors;
          rows.push(record);
        }

        setParsedRows(rows);
      } catch (parseErr) {
        setImportError("Gagal membaca atau mem-parsing berkas CSV.");
      }
    };
    reader.readAsText(file);
  };

  // Kirim data batch ke API backend
  const submitCSVImport = async () => {
    const invalidRows = parsedRows.filter(r => r.validationErrors.length > 0);
    if (invalidRows.length > 0) {
      setImportError("Tidak dapat memproses. Silakan perbaiki data yang bermasalah (ditandai dengan silang merah) dalam file CSV Anda terlebih dahulu.");
      return;
    }

    if (parsedRows.length === 0) {
      setImportError("Tidak ada data karyawan yang valid untuk diimpor.");
      return;
    }

    setImportLoading(true);
    setImportError("");

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: parsedRows }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowImportModal(false);
        setParsedRows([]);
        fetchData();
      } else {
        setImportError(data.error || "Gagal mengimpor data karyawan");
      }
    } catch (err) {
      setImportError("Gagal menyambung ke server");
    } finally {
      setImportLoading(false);
    }
  };

  // Buka modal edit dan isi form
  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({
      nik: emp.nik,
      name: emp.name,
      password: "", // Kosongkan password saat edit, kecuali ingin diganti
      role: emp.role,
      position: emp.position,
      department: emp.department,
      joinedAt: emp.joinedAt ? emp.joinedAt.split("T")[0] : "",
      hireDate: emp.hireDate ? emp.hireDate.split("T")[0] : "",
      leaveAnnual: emp.leaveAnnual.toString(),
      leaveLong: emp.leaveLong.toString(),
      status: emp.status || "AKTIF",
      contractType: emp.contractType || "PKWTT",
    });
    setShowModal("edit");
  };

  // Buka modal tambah
  const openAddModal = (defaultRole: string = "PELAKSANA", defaultContract: string = "PKWTT") => {
    const roleValue = defaultRole === "KARYAWAN" ? "PELAKSANA" : defaultRole;
    setFormData({
      nik: "",
      name: "",
      password: "",
      role: roleValue,
      position: "",
      department: "BAGIAN TATA USAHA & PERSONALIA UMUM",
      joinedAt: new Date().toISOString().split("T")[0],
      hireDate: new Date().toISOString().split("T")[0],
      leaveAnnual: "12",
      leaveLong: "0",
      status: "AKTIF",
      contractType: defaultContract,
    });
    setShowModal("add");
  };

    // Filtered Lists berdasarkan tanggal dan nama
    const filteredLeaves = leaves.filter((leave) => {
      // Filter Nama / NIK Karyawan
      if (leavesSearchName) {
        const query = leavesSearchName.toLowerCase();
        const matchName = leave.employee?.name?.toLowerCase().includes(query);
        const matchNik = leave.employee?.nik?.toLowerCase().includes(query);
        if (!matchName && !matchNik) return false;
      }

      // Filter Status Cuti
      if (leavesFilterStatus && leavesFilterStatus !== "ALL") {
        if (leavesFilterStatus === "BORROWED") {
          if (leave.status !== "APPROVED" || !leave.isBorrowed) return false;
        } else {
          if (leave.status !== leavesFilterStatus) return false;
        }
      }

      if (!leavesFilterStart && !leavesFilterEnd) return true;
      const start = leavesFilterStart ? new Date(leavesFilterStart) : null;
      const end = leavesFilterEnd ? new Date(leavesFilterEnd) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      const leaveStart = new Date(leave.startDate);
      leaveStart.setHours(12, 0, 0, 0);
      
      if (start && leaveStart < start) return false;
      if (end && leaveStart > end) return false;
      return true;
    });

    const filteredLoginLogs = loginLogs.filter((log) => {
      if (!logsFilterStart && !logsFilterEnd) return true;
      const start = logsFilterStart ? new Date(logsFilterStart) : null;
      const end = logsFilterEnd ? new Date(logsFilterEnd) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      const logDate = new Date(log.createdAt);
      if (start && logDate < start) return false;
      if (end && logDate > end) return false;
      return true;
    });

    const filteredEmployees = employees
      .filter((emp) => (emp.role === "PELAKSANA" || emp.role === "PIMPINAN" || emp.role === "KARYAWAN") && (emp.contractType === "PKWTT" || !emp.contractType))
      .filter((emp) => {
        if (empSearchName) {
          const query = empSearchName.toLowerCase();
          const matchName = emp.name.toLowerCase().includes(query);
          const matchNik = emp.nik.toLowerCase().includes(query);
          if (!matchName && !matchNik) return false;
        }
        if (empFilterStatus && empFilterStatus !== "ALL") {
          if (emp.status !== empFilterStatus) return false;
        }
        return true;
      });

    const filteredPKWT = employees
      .filter((emp) => (emp.role === "PELAKSANA" || emp.role === "PIMPINAN" || emp.role === "KARYAWAN") && emp.contractType === "PKWT")
      .filter((emp) => {
        if (pkwtSearchName) {
          const query = pkwtSearchName.toLowerCase();
          const matchName = emp.name.toLowerCase().includes(query);
          const matchNik = emp.nik.toLowerCase().includes(query);
          if (!matchName && !matchNik) return false;
        }
        if (pkwtFilterStatus && pkwtFilterStatus !== "ALL") {
          if (emp.status !== pkwtFilterStatus) return false;
        }
        return true;
      });

    const filteredAdmins = employees
      .filter((emp) => emp.role === "ADMIN")
      .filter((emp) => {
        if (adminSearchName) {
          const query = adminSearchName.toLowerCase();
          const matchName = emp.name.toLowerCase().includes(query);
          const matchNik = emp.nik.toLowerCase().includes(query);
          if (!matchName && !matchNik) return false;
        }
        if (adminFilterStatus && adminFilterStatus !== "ALL") {
          if (emp.status !== adminFilterStatus) return false;
        }
        return true;
      });

    const leavesTotalPages = Math.ceil(filteredLeaves.length / 50);
    const pkwttTotalPages = Math.ceil(filteredEmployees.length / 50);
    const pkwtTotalPages = Math.ceil(filteredPKWT.length / 50);
    const adminsTotalPages = Math.ceil(filteredAdmins.length / 50);

    const paginatedLeaves = filteredLeaves.slice((leavesPage - 1) * 50, leavesPage * 50);
    const paginatedEmployees = filteredEmployees.slice((pkwttPage - 1) * 50, pkwttPage * 50);
    const paginatedPKWT = filteredPKWT.slice((pkwtPage - 1) * 50, pkwtPage * 50);
    const paginatedAdmins = filteredAdmins.slice((adminPage - 1) * 50, adminPage * 50);

    // Helper untuk download CSV (Excel)
    const downloadCSV = (content: string, filename: string) => {
      const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const exportLeavesToCSV = () => {
      const headers = ["NIK", "Nama Karyawan", "Posisi", "Departemen", "Tipe Cuti", "Tanggal Mulai", "Tanggal Selesai", "Jumlah Hari", "Alasan", "Status", "Pinjam Cuti"];
      const rows = filteredLeaves.map(leave => [
        leave.employee?.nik || "",
        leave.employee?.name || "",
        leave.employee?.position || "",
        leave.employee?.department || "",
        leave.leaveType,
        new Date(leave.startDate).toLocaleDateString("id-ID"),
        new Date(leave.endDate).toLocaleDateString("id-ID"),
        leave.totalDays,
        leave.reason.replace(/;/g, ","),
        leave.status,
        leave.isBorrowed ? "Ya" : "Tidak"
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      downloadCSV(csvContent, `data_pengajuan_cuti_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const exportEmployeesToCSV = () => {
      const headers = ["NIK", "Nama", "Role", "Posisi", "Departemen", "Tanggal Masuk", "Tanggal Pengangkatan", "Cuti Tahunan (Hari)", "Cuti Panjang (Hari)", "Status"];
      const rows = filteredEmployees.map(emp => [
        emp.nik,
        emp.name,
        emp.role,
        emp.position,
        emp.department,
        new Date(emp.joinedAt).toLocaleDateString("id-ID"),
        new Date(emp.hireDate).toLocaleDateString("id-ID"),
        emp.leaveAnnual,
        emp.leaveLong,
        emp.status
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      downloadCSV(csvContent, `data_karyawan_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const exportPKWTToCSV = () => {
      const headers = ["NIK", "Nama", "Role", "Posisi", "Departemen", "Tanggal Masuk", "Tanggal Pengangkatan", "Cuti Tahunan (Hari)", "Status"];
      const rows = filteredPKWT.map(emp => [
        emp.nik,
        emp.name,
        emp.role,
        emp.position,
        emp.department,
        new Date(emp.joinedAt).toLocaleDateString("id-ID"),
        new Date(emp.hireDate).toLocaleDateString("id-ID"),
        emp.leaveAnnual,
        emp.status
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      downloadCSV(csvContent, `data_karyawan_pkwt_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const exportAdminsToCSV = () => {
      const headers = ["NIK", "Nama", "Role", "Posisi", "Departemen", "Tanggal Masuk", "Tanggal Pengangkatan", "Status"];
      const rows = filteredAdmins.map(emp => [
        emp.nik,
        emp.name,
        emp.role,
        emp.position,
        emp.department,
        new Date(emp.joinedAt).toLocaleDateString("id-ID"),
        new Date(emp.hireDate).toLocaleDateString("id-ID"),
        emp.status
      ]);

      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      downloadCSV(csvContent, `data_administrator_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const exportLoginLogsToCSV = () => {
      const headers = ["Waktu", "Aktivitas", "Perangkat", "NIK", "Nama Karyawan", "Posisi", "Departemen", "Role"];
      const rows = filteredLoginLogs.map(log => {
        const date = new Date(log.createdAt);
        const formattedDate = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        const cleanActivity = (log.activity || "Login (Membuka aplikasi)")
          .replace(/"/g, '""')
          .replace(/;/g, ',');
        const cleanDevice = (log.device || "Tidak Diketahui")
          .replace(/"/g, '""')
          .replace(/;/g, ',');
        return [
          `"${formattedDate}, ${formattedTime} WIB"`,
          `"${cleanActivity}"`,
          `"${cleanDevice}"`,
          log.employee?.nik || "",
          log.employee?.name || "",
          log.employee?.position || "",
          log.employee?.department || "",
          log.employee?.role || ""
        ];
      });

      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      downloadCSV(csvContent, `log_aktivitas_karyawan_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const handlePrintLeave = (leave: Leave) => {
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
            <title>Surat Izin Cuti - ${leave.employee?.name}</title>
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
                <p>Aplikasi Sistem Informasi Karyawan & Cuti (ASIK)</p>
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
                <td><strong>${leave.employee?.name}</strong></td>
              </tr>
              <tr>
                <td class="label">NIK (Nomor Induk)</td>
                <td class="colon">:</td>
                <td>${leave.employee?.nik}</td>
              </tr>
              <tr>
                <td class="label">Jabatan / Posisi</td>
                <td class="colon">:</td>
                <td>${leave.employee?.position}</td>
              </tr>
              <tr>
                <td class="label">Departemen</td>
                <td class="colon">:</td>
                <td>${leave.employee?.department}</td>
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
                <td>${leave.employee?.leaveAnnual} Hari</td>
              </tr>
              ${leave.employee?.contractType !== "PKWT" ? `
              <tr>
                <td class="label">Sisa Cuti Panjang</td>
                <td class="colon">:</td>
                <td>${leave.employee?.leaveLong} Hari</td>
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
                <p class="signature-name">${leave.employee?.name}</p>
                <p>NIK: ${leave.employee?.nik}</p>
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

    // Statistik dashboard
    const totalKaryawanPKWTT = employees.filter((e) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && (e.contractType === "PKWTT" || !e.contractType)).length;
    const totalKaryawanPKWT = employees.filter((e) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.contractType === "PKWT").length;
    const totalAdmins = employees.filter((e) => e.role === "ADMIN").length;
    const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
    const approvedLeaves = leaves.filter((l) => l.status === "APPROVED").length;
    const borrowedLeaves = leaves.filter((l) => l.status === "APPROVED" && l.isBorrowed).length;

    // Hitung status keaktifan untuk statistik dashboard (hanya karyawan, tidak termasuk admin)
    const activeStaff = employees.filter((e) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.status === "AKTIF").length;
    const inactiveStaff = employees.filter((e) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.status === "TIDAK_AKTIF").length;
    const retiredStaff = employees.filter((e) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.status === "PENSIUN").length;
    const ptdhStaff = employees.filter((e) => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.status === "PTDH").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {activeTab === "dashboard" && (
        <>
          {/* Grid Statistik Utama */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => {
                setActiveTab("employees");
                setEmpSearchName("");
                setEmpFilterStatus("ALL");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              title="Klik untuk membuka Data Karyawan (PKWTT)"
            >
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                👥
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Jumlah Karyawan (PKWTT)</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{totalKaryawanPKWTT}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("pkwt");
                setPkwtSearchName("");
                setPkwtFilterStatus("ALL");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
              title="Klik untuk membuka Data Karyawan (PKWT)"
            >
              <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                📝
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Jumlah PKWT</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{totalKaryawanPKWT}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("admins");
                setAdminSearchName("");
                setAdminFilterStatus("ALL");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-rose-300 transition-all"
              title="Klik untuk membuka Data Admin"
            >
              <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                🛡️
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Jumlah Admin</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{totalAdmins}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => {
                setActiveTab("leaves");
                setLeavesSearchName("");
                setLeavesFilterStart("");
                setLeavesFilterEnd("");
                setLeavesFilterStatus("PENDING");
              }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
              title="Klik untuk melihat Cuti Menunggu"
            >
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl font-bold">
                ⏳
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Cuti Menunggu</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-800">{pendingLeaves}</span>
                  <span className="text-xs text-slate-400 font-medium">Pengajuan</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("leaves");
                setLeavesSearchName("");
                setLeavesFilterStart("");
                setLeavesFilterEnd("");
                setLeavesFilterStatus("APPROVED");
              }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
              title="Klik untuk melihat Cuti Disetujui"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                ✅
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Cuti Disetujui</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-800">{approvedLeaves}</span>
                  <span className="text-xs text-slate-400 font-medium">Pengajuan</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("leaves");
                setLeavesSearchName("");
                setLeavesFilterStart("");
                setLeavesFilterEnd("");
                setLeavesFilterStatus("BORROWED");
              }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all"
              title="Klik untuk melihat Karyawan yang meminjam Cuti"
            >
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl font-bold">
                💸
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pinjam Cuti</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-800">{borrowedLeaves}</span>
                  <span className="text-xs text-slate-400 font-medium">Pengajuan</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div 
              onClick={() => {
                setActiveTab("employees");
                setEmpSearchName("");
                setEmpFilterStatus("AKTIF");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
              title="Klik untuk menyaring Karyawan Aktif"
            >
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                🟢
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Aktif</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{activeStaff}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("employees");
                setEmpSearchName("");
                setEmpFilterStatus("TIDAK_AKTIF");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-slate-400 transition-all"
              title="Klik untuk menyaring Karyawan Tidak Aktif"
            >
              <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                ⚫
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tidak Aktif</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{inactiveStaff}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("employees");
                setEmpSearchName("");
                setEmpFilterStatus("PENSIUN");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              title="Klik untuk menyaring Karyawan Pensiun"
            >
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                🔵
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Pensiun</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{retiredStaff}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>

            <div 
              onClick={() => {
                setActiveTab("employees");
                setEmpSearchName("");
                setEmpFilterStatus("PTDH");
              }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-rose-400 transition-all"
              title="Klik untuk menyaring Karyawan PTDH"
            >
              <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                🔴
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Pemberhentian Tidak Dengan Hormat (PTDH)</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-slate-800">{ptdhStaff}</span>
                  <span className="text-xs text-slate-400 font-medium">Orang</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Additional Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Left Column: Recent Pending Leaves */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  ⏳ Pengajuan Cuti Menunggu Persetujuan
                </h5>
                <button
                  onClick={() => setActiveTab("leaves")}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="flex-1 overflow-y-auto mt-4 divide-y divide-slate-100 pr-1">
                {leaves.filter(l => l.status === "PENDING").length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[220px] text-slate-400 text-xs py-8">
                    <span>🎉 Tidak ada pengajuan cuti yang menunggu persetujuan.</span>
                  </div>
                ) : (
                  leaves
                    .filter(l => l.status === "PENDING")
                    .slice(0, 5)
                    .map((leave) => (
                      <div key={leave.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-slate-800 text-xs">{leave.employee?.name}</span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">NIK: {leave.employee?.nik}</div>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">
                            {leave.leaveType} | {leave.totalDays} Hari
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400">
                            {new Date(leave.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} s/d {new Date(leave.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                          <div className="mt-1.5 flex gap-1 justify-end">
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              className="bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity Logs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  🕒 Aktivitas Terbaru
                </h5>
                <button
                  onClick={() => setActiveTab("logs")}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="flex-1 overflow-y-auto mt-4 divide-y divide-slate-100 pr-1">
                {loginLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[220px] text-slate-400 text-xs py-8">
                    <span>Belum ada riwayat aktivitas.</span>
                  </div>
                ) : (
                  loginLogs.slice(0, 5).map((log) => {
                    const logDate = new Date(log.createdAt);
                    const timeStr = logDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 font-medium break-words leading-relaxed">
                            <strong className="text-slate-800">{log.employee?.name}</strong>: {log.activity}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-slate-400">
                              {logDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} - {timeStr} WIB
                            </span>
                            {log.device && (
                              <span className="text-[8px] bg-emerald-50/75 text-slate-600 px-1 py-0.2 rounded font-semibold border border-emerald-100/50">
                                {log.device.includes("(PC)") ? "💻" : log.device.includes("(Mobile)") ? "📱" : "🌐"} {log.device}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        activeTab !== "dashboard" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {activeTab === "leaves" && (
            <div>
              {/* Header Action */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700">Daftar Pengajuan Cuti</h4>
                <button
                  onClick={exportLeavesToCSV}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200/50 flex items-center gap-1.5 shadow-xs"
                >
                  📥 Export ke Excel
                </button>
              </div>

              {/* Date Filter Bar */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Cari Karyawan:</span>
                    <input
                      type="text"
                      placeholder="Nama / NIK..."
                      value={leavesSearchName}
                      onChange={(e) => setLeavesSearchName(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors w-44"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Tanggal Cuti:</span>
                    <input
                      type="date"
                      value={leavesFilterStart}
                      onChange={(e) => setLeavesFilterStart(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="text-xs text-slate-400">s/d</span>
                    <input
                      type="date"
                      value={leavesFilterEnd}
                      onChange={(e) => setLeavesFilterEnd(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                    <select
                      value={leavesFilterStatus}
                      onChange={(e) => setLeavesFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="PENDING">Menunggu (Pending)</option>
                      <option value="APPROVED">Disetujui (Approved)</option>
                      <option value="REJECTED">Ditolak (Rejected)</option>
                      <option value="BORROWED">Pinjam Cuti</option>
                    </select>
                  </div>
                  {(leavesSearchName || leavesFilterStart || leavesFilterEnd || leavesFilterStatus !== "ALL") && (
                    <button
                       onClick={() => {
                         setLeavesSearchName("");
                         setLeavesFilterStart("");
                         setLeavesFilterEnd("");
                         setLeavesFilterStatus("ALL");
                       }}
                       className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan <span className="font-bold text-slate-700">{filteredLeaves.length}</span> dari <span className="font-bold text-slate-700">{leaves.length}</span> data
                </div>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Posisi & Dep.</th>
                    <th className="px-6 py-4">Tipe Cuti</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Alasan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        {leaves.length === 0 
                          ? "Tidak ada riwayat pengajuan cuti." 
                          : "Tidak ada pengajuan cuti dalam rentang tanggal filter."}
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{leave.employee?.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">NIK: {leave.employee?.nik}</div>
                          <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                            Sisa Cuti: Tahunan {leave.employee?.leaveAnnual} Hari
                            {leave.employee?.contractType !== "PKWT" && ` | Panjang ${leave.employee?.leaveLong} Hari`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{leave.employee?.position}</div>
                          <div className="text-xs text-slate-500">{leave.employee?.department}</div>
                        </td>
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
                          <div className="text-xs">
                            {new Date(leave.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            <span className="text-slate-400 mx-1">s/d</span>
                            {new Date(leave.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold">{leave.totalDays} Hari</td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4">
                          <BadgeStatus status={leave.status} isBorrowed={leave.isBorrowed} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {leave.status === "PENDING" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(leave.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                              >
                                Tolak
                              </button>
                              <button
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                title="Hapus pengajuan"
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-2">
                              <span className="text-xs text-slate-400 font-medium">Selesai diproses</span>
                              {leave.status === "APPROVED" && (
                                <button
                                  onClick={() => handlePrintLeave(leave)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                                  title="Cetak Surat Cuti"
                                >
                                  🖨️ Cetak
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteLeave(leave.id)}
                                className="bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                title="Hapus pengajuan"
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar for Leaves */}
            {leavesTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan halaman <span className="font-bold text-slate-700">{leavesPage}</span> dari <span className="font-bold text-slate-700">{leavesTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{filteredLeaves.length}</span> data)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLeavesPage(prev => Math.max(prev - 1, 1))}
                    disabled={leavesPage === 1}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      leavesPage === 1
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                    }`}
                  >
                    ⬅️ Sebelumnya
                  </button>

                  {Array.from({ length: leavesTotalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === leavesTotalPages || Math.abs(page - leavesPage) <= 1)
                    .map((page, index, arr) => {
                      const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                          <button
                            onClick={() => setLeavesPage(page)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              leavesPage === page
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
                    onClick={() => setLeavesPage(prev => Math.min(prev + 1, leavesTotalPages))}
                    disabled={leavesPage === leavesTotalPages}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      leavesPage === leavesTotalPages
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

          {activeTab === "employees" && (
            <div>
              {/* Header Action */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700">Daftar Akun Karyawan</h4>
                <div className="flex gap-2">
                  <button
                    onClick={exportEmployeesToCSV}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200/50 flex items-center gap-1.5"
                  >
                    📥 Export ke Excel
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    📥 Import Excel
                  </button>
                  <button
                    onClick={() => openAddModal("KARYAWAN")}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    ➕ Tambah Karyawan
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Cari Nama/NIK:</span>
                    <input
                      type="text"
                      placeholder="Cari..."
                      value={empSearchName}
                      onChange={(e) => setEmpSearchName(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors w-44"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                    <select
                      value={empFilterStatus}
                      onChange={(e) => setEmpFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="AKTIF">Aktif</option>
                      <option value="TIDAK_AKTIF">Tidak Aktif</option>
                      <option value="PENSIUN">Pensiun</option>
                      <option value="PTDH">PTDH</option>
                    </select>
                  </div>
                  {(empSearchName || empFilterStatus !== "ALL") && (
                    <button
                      onClick={() => {
                        setEmpSearchName("");
                        setEmpFilterStatus("ALL");
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan <span className="font-bold text-slate-700">{filteredEmployees.length}</span> dari <span className="font-bold text-slate-700">{employees.filter(e => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && (e.contractType === "PKWTT" || !e.contractType)).length}</span> karyawan PKWTT
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Karyawan</th>
                      <th className="px-6 py-4">Jabatan</th>
                      <th className="px-6 py-4">Departemen</th>
                      <th className="px-6 py-4">Pengangkatan</th>
                      <th className="px-6 py-4">Kuota Tahunan</th>
                      <th className="px-6 py-4">Kuota Panjang</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">
                          {employees.filter((e) => e.role === "KARYAWAN").length === 0 
                            ? "Tidak ada data karyawan." 
                            : "Tidak ada data karyawan yang cocok dengan filter."}
                        </td>
                      </tr>
                    ) : (
                    paginatedEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">NIK: {emp.nik}</div>
                          </td>
                          <td className="px-6 py-4">{emp.position}</td>
                          <td className="px-6 py-4">{emp.department}</td>
                          <td className="px-6 py-4 text-xs">
                            {new Date(emp.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${emp.leaveAnnual < 0 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded" : "text-slate-800"}`}>
                              {emp.leaveAnnual} Hari
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${emp.leaveLong < 0 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded" : "text-slate-800"}`}>
                              {emp.leaveLong} Hari
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <BadgeEmployeeStatus status={emp.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                              {emp.role !== "ADMIN" && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar for PKWTT */}
              {pkwttTotalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan halaman <span className="font-bold text-slate-700">{pkwttPage}</span> dari <span className="font-bold text-slate-700">{pkwttTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{filteredEmployees.length}</span> data)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPkwttPage(prev => Math.max(prev - 1, 1))}
                      disabled={pkwttPage === 1}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        pkwttPage === 1
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                      }`}
                    >
                      ⬅️ Sebelumnya
                    </button>

                    {Array.from({ length: pkwttTotalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === pkwttTotalPages || Math.abs(page - pkwttPage) <= 1)
                      .map((page, index, arr) => {
                        const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                            <button
                              onClick={() => setPkwttPage(page)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                pkwttPage === page
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
                      onClick={() => setPkwttPage(prev => Math.min(prev + 1, pkwttTotalPages))}
                      disabled={pkwttPage === pkwttTotalPages}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        pkwttPage === pkwttTotalPages
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

          {activeTab === "pkwt" && (
            <div>
              {/* Header Action */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700">Daftar Akun Karyawan PKWT</h4>
                <div className="flex gap-2">
                  <button
                    onClick={exportPKWTToCSV}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200/50 flex items-center gap-1.5 shadow-xs"
                  >
                    📥 Export ke Excel
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    📥 Import Excel
                  </button>
                  <button
                    onClick={() => openAddModal("KARYAWAN", "PKWT")}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    ➕ Tambah Karyawan PKWT
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Cari Nama/NIK:</span>
                    <input
                      type="text"
                      placeholder="Cari..."
                      value={pkwtSearchName}
                      onChange={(e) => setPkwtSearchName(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors w-44"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                    <select
                      value={pkwtFilterStatus}
                      onChange={(e) => setPkwtFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="AKTIF">Aktif</option>
                      <option value="TIDAK_AKTIF">Tidak Aktif</option>
                      <option value="PENSIUN">Pensiun</option>
                      <option value="PTDH">PTDH</option>
                    </select>
                  </div>
                  {(pkwtSearchName || pkwtFilterStatus !== "ALL") && (
                    <button
                      onClick={() => {
                        setPkwtSearchName("");
                        setPkwtFilterStatus("ALL");
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan <span className="font-bold text-slate-700">{filteredPKWT.length}</span> dari <span className="font-bold text-slate-700">{employees.filter(e => (e.role === "PELAKSANA" || e.role === "PIMPINAN" || e.role === "KARYAWAN") && e.contractType === "PKWT").length}</span> karyawan PKWT
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Karyawan</th>
                      <th className="px-6 py-4">Jabatan</th>
                      <th className="px-6 py-4">Departemen</th>
                      <th className="px-6 py-4">Mulai Kontrak</th>
                      <th className="px-6 py-4">Akhir Kontrak</th>
                      <th className="px-6 py-4">Kuota Tahunan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredPKWT.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">
                          {employees.filter((e) => e.role === "KARYAWAN" && e.contractType === "PKWT").length === 0 
                            ? "Tidak ada data karyawan PKWT." 
                            : "Tidak ada data karyawan PKWT yang cocok dengan filter."}
                        </td>
                      </tr>
                    ) : (
                    paginatedPKWT.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">NIK: {emp.nik}</div>
                          </td>
                          <td className="px-6 py-4">{emp.position}</td>
                          <td className="px-6 py-4">{emp.department}</td>
                          <td className="px-6 py-4 text-xs">
                            {new Date(emp.joinedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            {new Date(emp.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${emp.leaveAnnual < 0 ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded" : "text-slate-800"}`}>
                              {emp.leaveAnnual} Hari
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <BadgeEmployeeStatus status={emp.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                              {emp.role !== "ADMIN" && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar for PKWT */}
              {pkwtTotalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan halaman <span className="font-bold text-slate-700">{pkwtPage}</span> dari <span className="font-bold text-slate-700">{pkwtTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{filteredPKWT.length}</span> data)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPkwtPage(prev => Math.max(prev - 1, 1))}
                      disabled={pkwtPage === 1}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        pkwtPage === 1
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                      }`}
                    >
                      ⬅️ Sebelumnya
                    </button>

                    {Array.from({ length: pkwtTotalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === pkwtTotalPages || Math.abs(page - pkwtPage) <= 1)
                      .map((page, index, arr) => {
                        const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                            <button
                              onClick={() => setPkwtPage(page)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                pkwtPage === page
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
                      onClick={() => setPkwtPage(prev => Math.min(prev + 1, pkwtTotalPages))}
                      disabled={pkwtPage === pkwtTotalPages}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        pkwtPage === pkwtTotalPages
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

          {activeTab === "admins" && (
            <div>
              {/* Header Action */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700">Daftar Akun Administrator</h4>
                <div className="flex gap-2">
                  <button
                    onClick={exportAdminsToCSV}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200/50 flex items-center gap-1.5"
                  >
                    📥 Export ke Excel
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    📥 Import Excel
                  </button>
                  <button
                    onClick={() => openAddModal("ADMIN")}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    ➕ Tambahkan Admin Baru
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Cari Nama/NIK:</span>
                    <input
                      type="text"
                      placeholder="Cari..."
                      value={adminSearchName}
                      onChange={(e) => setAdminSearchName(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors w-44"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
                    <select
                      value={adminFilterStatus}
                      onChange={(e) => setAdminFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="AKTIF">Aktif</option>
                      <option value="TIDAK_AKTIF">Tidak Aktif</option>
                      <option value="PENSIUN">Pensiun</option>
                      <option value="PTDH">PTDH</option>
                    </select>
                  </div>
                  {(adminSearchName || adminFilterStatus !== "ALL") && (
                    <button
                      onClick={() => {
                        setAdminSearchName("");
                        setAdminFilterStatus("ALL");
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan <span className="font-bold text-slate-700">{filteredAdmins.length}</span> dari <span className="font-bold text-slate-700">{employees.filter(e => e.role === "ADMIN").length}</span> administrator
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Admin</th>
                      <th className="px-6 py-4">Jabatan</th>
                      <th className="px-6 py-4">Departemen</th>
                      <th className="px-6 py-4">Pengangkatan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">
                          {employees.filter((e) => e.role === "ADMIN").length === 0 
                            ? "Tidak ada data admin." 
                            : "Tidak ada data admin yang cocok dengan filter."}
                        </td>
                      </tr>
                    ) : (
                    paginatedAdmins.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">{emp.name}</div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">NIK: {emp.nik}</div>
                            </td>
                            <td className="px-6 py-4">{emp.position}</td>
                            <td className="px-6 py-4">{emp.department}</td>
                            <td className="px-6 py-4 text-xs">
                              {new Date(emp.hireDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </td>
                            <td className="px-6 py-4">
                              <BadgeEmployeeStatus status={emp.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(emp)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                >
                                  Edit
                                </button>
                                {emp.nik !== currentUser?.nik && (
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar for Admins */}
              {adminsTotalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan halaman <span className="font-bold text-slate-700">{adminPage}</span> dari <span className="font-bold text-slate-700">{adminsTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{filteredAdmins.length}</span> data)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setAdminPage(prev => Math.max(prev - 1, 1))}
                      disabled={adminPage === 1}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        adminPage === 1
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                      }`}
                    >
                      ⬅️ Sebelumnya
                    </button>

                    {Array.from({ length: adminsTotalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === adminsTotalPages || Math.abs(page - adminPage) <= 1)
                      .map((page, index, arr) => {
                        const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                            <button
                              onClick={() => setAdminPage(page)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                adminPage === page
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
                      onClick={() => setAdminPage(prev => Math.min(prev + 1, adminsTotalPages))}
                      disabled={adminPage === adminsTotalPages}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        adminPage === adminsTotalPages
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

          {activeTab === "logs" && (
            <div>
              {/* Header Action */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700">Log Aktivitas Terbaru</h4>
                <div className="flex gap-2">
                  <button
                    onClick={exportLoginLogsToCSV}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors border border-slate-200/50 flex items-center gap-1.5 shadow-xs"
                  >
                    📥 Export ke Excel
                  </button>
                  <button
                    onClick={handleClearAllLogs}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    🗑️ Kosongkan Log
                  </button>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500">Filter Tanggal:</span>
                  <input
                    type="date"
                    value={logsFilterStart}
                    onChange={(e) => setLogsFilterStart(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-xs text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={logsFilterEnd}
                    onChange={(e) => setLogsFilterEnd(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                  {(logsFilterStart || logsFilterEnd) && (
                    <button
                       onClick={() => {
                         setLogsFilterStart("");
                         setLogsFilterEnd("");
                       }}
                       className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan <span className="font-bold text-slate-700">{filteredLoginLogs.length}</span> dari <span className="font-bold text-slate-700">{loginLogs.length}</span> data
                </div>
              </div>

              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Waktu & Aktivitas</th>
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Posisi & Dep.</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredLoginLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        {loginLogs.length === 0 
                          ? "Belum ada log aktivitas login." 
                          : "Tidak ada log login dalam rentang tanggal filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredLoginLogs.map((log) => {
                      const date = new Date(log.createdAt);
                      const formattedDate = date.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      // Format jam menggunakan titik dua (:)
                      const hours = String(date.getHours()).padStart(2, "0");
                      const minutes = String(date.getMinutes()).padStart(2, "0");
                      const seconds = String(date.getSeconds()).padStart(2, "0");
                      const formattedTime = `${hours}:${minutes}:${seconds}`;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs text-slate-600">
                              {formattedDate}, {formattedTime} WIB
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <div className="text-xs text-slate-500 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200/50 font-medium">
                                {log.activity || "Login (Membuka aplikasi)"}
                              </div>
                              {log.device && (
                                <div className="text-[10px] text-slate-600 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/80 font-semibold shadow-3xs">
                                  {log.device.includes("(PC)") ? "💻" : log.device.includes("(Mobile)") ? "📱" : "🌐"} {log.device}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{log.employee?.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">NIK: {log.employee?.nik}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>{log.employee?.position}</div>
                            <div className="text-xs text-slate-500">{log.employee?.department}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs font-bold tracking-wide rounded ${
                              log.employee?.role === "ADMIN" 
                                ? "bg-rose-100 text-rose-800" 
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {log.employee?.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors"
                              title="Hapus baris log"
                            >
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {logsTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan halaman <span className="font-bold text-slate-700">{logsPage}</span> dari <span className="font-bold text-slate-700">{logsTotalPages}</span> halaman (Total <span className="font-bold text-slate-700">{logsTotal}</span> data)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLogsPage(prev => Math.max(prev - 1, 1))}
                    disabled={logsPage === 1}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      logsPage === 1
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-xs"
                    }`}
                  >
                    ⬅️ Sebelumnya
                  </button>

                  {Array.from({ length: logsTotalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === logsTotalPages || Math.abs(page - logsPage) <= 1)
                    .map((page, index, arr) => {
                      const showEllipsisBefore = index > 0 && page - arr[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && <span className="text-slate-400 text-xs px-1">...</span>}
                          <button
                            onClick={() => setLogsPage(page)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              logsPage === page
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
                    onClick={() => setLogsPage(prev => Math.min(prev + 1, logsTotalPages))}
                    disabled={logsPage === logsTotalPages}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      logsPage === logsTotalPages
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
          </div>
        )
      )}

      {/* Modal Add/Edit Karyawan */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {showModal === "add" 
                  ? (formData.role === "ADMIN" ? "Tambahkan Admin Baru" : "Tambah Karyawan Baru") 
                  : (formData.role === "ADMIN" ? "Edit Data Admin" : "Edit Data Karyawan")}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    NIK (Nomor Induk)
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={showModal === "edit"}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/[^0-9]/g, "") })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password {showModal === "edit" && <span className="text-[10px] text-slate-400 font-normal lowercase">(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  required={showModal === "add"}
                  placeholder={showModal === "edit" ? "••••••••" : ""}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Posisi / Jabatan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Departemen
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="BAGIAN TATA USAHA & PERSONALIA UMUM">BAGIAN TATA USAHA & PERSONALIA UMUM</option>
                    <option value="BAGIAN TEKNIK PABRIK">BAGIAN TEKNIK PABRIK</option>
                    <option value="BAGIAN MUTU">BAGIAN MUTU</option>
                    <option value="BAGIAN PENGOLAHAN SHIFT 1">BAGIAN PENGOLAHAN SHIFT 1</option>
                    <option value="BAGIAN PENGOLAHAN SHIFT 2">BAGIAN PENGOLAHAN SHIFT 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Role Hak Akses
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="PELAKSANA">PELAKSANA (Karyawan Pelaksana)</option>
                    <option value="PIMPINAN">PIMPINAN (Karyawan Pimpinan)</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="TIDAK_AKTIF">Tidak Aktif</option>
                    <option value="PENSIUN">Pensiun</option>
                    <option value="PTDH">Pemberhentian Tidak Dengan Hormat (PTDH)</option>
                  </select>
                </div>
              </div>

              {(formData.role === "PELAKSANA" || formData.role === "PIMPINAN" || formData.role === "KARYAWAN") && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jenis Perjanjian Kerja (Kontrak)
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        contractType: val,
                        leaveLong: val === "PKWT" ? "0" : formData.leaveLong
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="PKWTT">PKWTT (Pegawai Tetap)</option>
                    <option value="PKWT">PKWT (Pegawai Kontrak)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {formData.contractType === "PKWT" ? "Tanggal Mulai Kontrak" : "Tanggal Mulai Masuk"}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joinedAt}
                    onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {formData.contractType === "PKWT" ? "Tanggal Akhir Kontrak" : "Tanggal Pengangkatan"}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {showModal === "edit" && formData.role !== "ADMIN" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Kuota Tahunan
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.leaveAnnual}
                      onChange={(e) => setFormData({ ...formData, leaveAnnual: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {formData.contractType !== "PKWT" ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Kuota Panjang
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.leaveLong}
                        onChange={(e) => setFormData({ ...formData, leaveLong: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Kuota Panjang
                      </label>
                      <input
                        type="text"
                        disabled
                        value="0 Hari (PKWT)"
                        className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-sm px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Karyawan (CSV) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  📥 Impor Data Karyawan Massal (CSV)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah file CSV dengan data karyawan baru. Gunakan titik koma (;) atau koma (,) sebagai pemisah kolom.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                  setImportError("");
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {importError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg font-medium animate-shake">
                  ⚠️ {importError}
                </div>
              )}

              {/* Instructions and Download Template */}
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Langkah-langkah penggunaan:</h4>
                  <ul className="text-xs text-slate-500 list-decimal list-inside space-y-1">
                    <li>Unduh templat file contoh pengunggahan dengan mengklik tombol di sebelah kanan.</li>
                    <li>Isi data karyawan pada kolom yang disediakan.</li>
                    <li>Simpan file dalam format **CSV (Comma Delimited)**.</li>
                    <li>Unggah file CSV yang telah diisi di area bawah.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplateCSV}
                  className="bg-emerald-50 hover:bg-emerald-100/85 text-emerald-600 border border-emerald-200/60 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-xs hover:border-emerald-300"
                >
                  📄 Unduh Contoh File (CSV)
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors bg-slate-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-3xl mb-2">📁</span>
                <span className="text-xs font-bold text-slate-700">Pilih Berkas CSV</span>
                <span className="text-[10px] text-slate-400 mt-1">atau seret file CSV Anda ke sini</span>
              </div>

              {/* Data Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pratinjau Data ({parsedRows.length} baris terdeteksi)
                    </h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200/50">
                      Periksa status kolom validasi sebelum memproses impor
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3">NIK</th>
                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Jabatan</th>
                          <th className="px-4 py-3">Departemen</th>
                          <th className="px-4 py-3">Tgl Masuk</th>
                          <th className="px-4 py-3">Tgl Pengangkatan</th>
                          <th className="px-4 py-3">Kontrak</th>
                          <th className="px-4 py-3">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {parsedRows.map((row, index) => {
                          const hasError = row.validationErrors?.length > 0;
                          return (
                            <tr key={index} className={`hover:bg-slate-50/50 transition-colors ${hasError ? "bg-rose-50/30" : ""}`}>
                              <td className="px-4 py-3.5 font-mono font-medium">{row.nik || "-"}</td>
                              <td className="px-4 py-3.5 font-medium text-slate-800">{row.name || "-"}</td>
                              <td className="px-4 py-3.5">
                                {row.role ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200/50">
                                    {row.role}
                                  </span>
                                ) : "-"}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">{row.position || "-"}</td>
                              <td className="px-4 py-3.5 max-w-[150px] truncate text-slate-600" title={row.department}>{row.department || "-"}</td>
                              <td className="px-4 py-3.5 font-mono text-slate-600">{row.joinedAt || "-"}</td>
                              <td className="px-4 py-3.5 font-mono text-slate-600">{row.hireDate || "-"}</td>
                              <td className="px-4 py-3.5 font-medium text-slate-700">{row.contractType || "-"}</td>
                              <td className="px-4 py-3.5">
                                {hasError ? (
                                  <div className="flex flex-col gap-0.5">
                                    {row.validationErrors.map((err: string, eIdx: number) => (
                                      <span key={eIdx} className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                                        ❌ {err}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                    ✅ Siap Diimpor
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                  setImportError("");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importLoading || parsedRows.length === 0 || parsedRows.some(r => r.validationErrors?.length > 0)}
                onClick={submitCSVImport}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center gap-2"
              >
                {importLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Proses Impor ({parsedRows.filter(r => !(r.validationErrors?.length > 0)).length} Data Valid)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
