"use client";

import { useEffect, useState } from "react";

interface NavbarProps {
  title: string;
  onOpenSidebar?: () => void;
}

export default function Navbar({ title, onOpenSidebar }: NavbarProps) {
  const [timeStr, setTimeStr] = useState("");
  const [shortTimeStr, setShortTimeStr] = useState("");

  useEffect(() => {
    // Fungsi untuk memperbarui tanggal dan jam real-time dengan pemisah titik dua (:)
    const updateTime = () => {
      const now = new Date();
      
      // Format lengkap untuk Desktop
      const datePartFull = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      
      // Format pendek untuk Mobile HP
      const datePartShort = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      // Ambil jam, menit, detik secara manual untuk memaksa format titik dua (:)
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const timePart = `${hours}:${minutes}:${seconds}`;

      setTimeStr(`${datePartFull} - ${timePart} WIB`);
      setShortTimeStr(`${datePartShort}, ${timePart}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-lg font-bold"
            aria-label="Buka menu"
          >
            ☰
          </button>
        )}
        <h1 className="text-md md:text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {timeStr && (
          <span className="text-[10px] md:text-xs text-slate-600 font-semibold bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full whitespace-nowrap border border-emerald-200/50 shadow-xs flex items-center gap-1.5">
            🕒 
            <span className="hidden sm:inline">{timeStr}</span>
            <span className="sm:hidden">{shortTimeStr}</span>
          </span>
        )}
      </div>
    </header>
  );
}
