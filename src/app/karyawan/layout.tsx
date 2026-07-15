import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJWT } from "@/utils/jwt";
import DashboardWrapper from "@/components/shared/DashboardWrapper";

export default async function KaryawanLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyJWT(token);
  if (!payload || (payload.role !== "KARYAWAN" && payload.role !== "PIMPINAN" && payload.role !== "PELAKSANA")) {
    redirect("/login");
  }

  return (
    <DashboardWrapper user={{ name: payload.name, role: payload.role, nik: payload.nik }}>
      {children}
    </DashboardWrapper>
  );
}
