"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/app/admin/AdminContext";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    nik: string;
  };
  onClose?: () => void;
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, setActiveTab, counts } = useAdmin();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAdmin = user.role === "ADMIN";

  const links = isAdmin
    ? [
        { href: "/admin", label: "Dashboard Admin", icon: "📊" },
      ]
    : [
        { href: "/karyawan", label: "Dashboard Cuti", icon: "📅" },
      ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl flex-shrink-0">
      {/* Brand Header with Close Button for Mobile */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-emerald-400">ASIK APP</h1>
          <p className="text-xs text-slate-400 mt-1">Sistem Informasi Karyawan</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-sm"
            aria-label="Tutup menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="p-6 bg-slate-800/40 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-900 font-bold flex items-center justify-center text-lg flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate text-slate-100">{user.name}</h2>
            <p className="text-xs text-slate-400 font-mono truncate">{user.nik}</p>
            <span className="mt-1 inline-block text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <div key={link.href} className="space-y-1">
              <Link
                href={link.href}
                onClick={() => {
                  if (isAdmin && link.href === "/admin") {
                    setActiveTab("dashboard");
                  }
                  handleLinkClick();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500 text-slate-900 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>

              {/* Sub-menus under Dashboard Admin */}
              {isActive && isAdmin && (
                <div className="pl-4 pr-1 py-1 flex flex-col gap-1 border-l-2 border-emerald-500/30 ml-4 mt-1">
                  <button
                    onClick={() => {
                      setActiveTab("dashboard");
                      handleLinkClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === "dashboard"
                        ? "bg-slate-800 text-emerald-400 font-bold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">📈 Ringkasan Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("leaves");
                      handleLinkClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === "leaves"
                        ? "bg-slate-800 text-emerald-400 font-bold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">📂 Pengajuan Cuti</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      activeTab === "leaves" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}>{counts.leaves}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("employees");
                      handleLinkClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === "employees"
                        ? "bg-slate-800 text-emerald-400 font-bold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">👥 Karyawan (PKWTT)</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      activeTab === "employees" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}>{counts.pkwtt}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("pkwt");
                      handleLinkClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === "pkwt"
                        ? "bg-slate-800 text-emerald-400 font-bold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">📝 Karyawan (PKWT)</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      activeTab === "pkwt" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}>{counts.pkwt}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("admins");
                      handleLinkClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === "admins"
                        ? "bg-slate-800 text-emerald-400 font-bold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">🛡️ Data Admin</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      activeTab === "admins" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}>{counts.admins}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("logs");
                      handleLinkClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === "logs"
                        ? "bg-slate-800 text-emerald-400 font-bold"
                        : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">🕒 Log Aktivitas</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      activeTab === "logs" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                    }`}>{counts.logs}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-50/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
