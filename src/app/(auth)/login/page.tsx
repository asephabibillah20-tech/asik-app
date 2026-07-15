"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nik, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat login");
      }

      // Redirect berdasarkan role
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/karyawan");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyambung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
            🔑
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">ASIK PAG</h2>
          <p className="text-sm text-slate-400 mt-2">Aplikasi Sistem Informasi Karyawan PKS Aur Gading</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Nomor Induk Karyawan (NIK)
            </label>
            <input
              type="text"
              required
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="Masukkan NIK Anda"
              className="w-full bg-slate-950/50 border border-slate-800 focus:border-emerald-500 text-slate-100 text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full bg-slate-950/50 border border-slate-800 focus:border-emerald-500 text-slate-100 text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm py-3.5 px-4 rounded-xl transition-all duration-150 shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Masuk ke Akun"
            )}
          </button>
        </form>

        {/* Help / Footer */}
        <div className="text-center mt-8 text-xs text-slate-500 border-t border-slate-800/80 pt-6">
          <p>Butuh bantuan login? Hubungi HR Departemen.</p>
        </div>
      </div>
    </div>
  );
}
