import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJWT } from "@/utils/jwt";
import DashboardWrapper from "@/components/shared/DashboardWrapper";
import { AdminProvider } from "./AdminContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminProvider>
      <DashboardWrapper user={{ name: payload.name, role: payload.role, nik: payload.nik }}>
        {children}
      </DashboardWrapper>
    </AdminProvider>
  );
}
