import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./utils/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil token dari cookie
  const token = request.cookies.get("token")?.value;

  const isAdminRoute = pathname.startsWith("/admin");
  const isKaryawanRoute = pathname.startsWith("/karyawan");
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";

  // 1. Pengalihan halaman Root (/)
  if (isRootRoute) {
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        if (payload.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", request.url));
        } else {
          return NextResponse.redirect(new URL("/karyawan", request.url));
        }
      }
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Proteksi Rute Admin & Karyawan
  if (isAdminRoute || isKaryawanRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Proteksi berdasarkan Role
    if (isAdminRoute && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/karyawan", request.url));
    }

    if (isKaryawanRoute && payload.role !== "KARYAWAN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // 3. Jika user yang sudah login mencoba mengakses /login
  if (isLoginRoute && token) {
    const payload = await verifyJWT(token);
    if (payload) {
      if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/karyawan", request.url));
      }
    }
  }

  return NextResponse.next();
}

// Hanya jalankan middleware pada rute halaman dashboard dan auth
export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/karyawan/:path*"
  ],
};
