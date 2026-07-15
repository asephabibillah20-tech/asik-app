"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  user: {
    name: string;
    role: string;
    nik: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl flex-shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-emerald-400">ASIK</h1>
        <p className="text-xs text-slate-400 mt-1">Aplikasi Sistem Informasi Karyawan PKS Aur Gading</p>
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
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500 text-slate-900 font-bold shadow-md shadow-emerald-500/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
