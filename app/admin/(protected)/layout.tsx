import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Self-healing: session lama (dibuat sebelum fitur role) tidak punya field role.
  // Ambil role & nama langsung dari DB agar sidebar akurat tanpa harus login ulang.
  let role = session.role;
  let name = session.name;

  if (!role) {
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { role: true, name: true },
    });
    role = admin?.role || "ADMIN";
    name = admin?.name ?? name;
  }

  return (
    <div className="flex min-h-screen bg-surface-low">
      <AdminSidebar role={role} name={name} />
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
