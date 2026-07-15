"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Referensi untuk waktu aktivitas terakhir
  const lastActivityRef = useRef<number>(Date.now());
  
  // Referensi untuk data update terakhir
  const lastStateRef = useRef<{ leaveCount: number; employeeCount: number; lastUpdate: number } | null>(null);

  useEffect(() => {
    // Jangan jalankan jika berada di halaman login
    if (pathname === "/login") return;

    // ==========================================
    // 1. LOGIKA AUTO-LOGOUT 15 MENIT INAKTIF
    // ==========================================
    const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 menit dalam milidetik

    const handleLogout = async () => {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (res.ok) {
          router.push("/login");
          router.refresh();
        }
      } catch (err) {
        console.error("Gagal melakukan auto-logout:", err);
      }
    };

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    // Daftarkan event listener aktivitas pengguna
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Cek inaktivitas setiap 5 detik
    const idleInterval = setInterval(() => {
      const timeDiff = Date.now() - lastActivityRef.current;
      if (timeDiff >= IDLE_TIMEOUT) {
        clearInterval(idleInterval);
        handleLogout();
      }
    }, 5000);

    // ==========================================
    // 2. LOGIKA AUTO-REFRESH JIKA ADA DATA BARU
    // ==========================================
    const checkUpdates = async () => {
      try {
        const res = await fetch("/api/updates");
        if (!res.ok) return;
        const data = await res.json();

        if (lastStateRef.current) {
          const state = lastStateRef.current;
          // Bandingkan jumlah record dan waktu update terakhir
          if (
            data.leaveCount !== state.leaveCount ||
            data.employeeCount !== state.employeeCount ||
            data.lastUpdate !== state.lastUpdate
          ) {
            // Ada update data terbaru! Kirim event untuk refresh data di halaman yang aktif
            window.dispatchEvent(new Event("db-update"));
            router.refresh();
          }
        }
        // Simpan state terakhir
        lastStateRef.current = {
          leaveCount: data.leaveCount,
          employeeCount: data.employeeCount,
          lastUpdate: data.lastUpdate,
        };
      } catch (err) {
        console.error("Gagal mengecek update data:", err);
      }
    };

    // Jalankan cek pertama setelah 3 detik, kemudian setiap 15 detik
    const initialCheckTimeout = setTimeout(checkUpdates, 3000);
    const updateInterval = setInterval(checkUpdates, 15000);

    return () => {
      // Bersihkan semua listener dan interval
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(idleInterval);
      clearTimeout(initialCheckTimeout);
      clearInterval(updateInterval);
    };
  }, [pathname, router]);

  return null;
}
