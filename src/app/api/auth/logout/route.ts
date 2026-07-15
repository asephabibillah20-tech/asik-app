import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/utils/auth";
import { logActivity } from "@/lib/leaveHelper";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      const decoded = await verifyJWT(token);
      if (decoded) {
        await logActivity(decoded.userId, "Logout (Keluar dari aplikasi)");
      }
    }
  } catch (error) {
    console.error("Gagal mencatat log logout:", error);
  }

  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.delete("token");
  return response;
}
