import { getDriversPage } from "@/app/actions/admin-driver";
import DriverManager from "@/components/admin/DriverManager";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

export default async function AdminDrivers({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const pageSize = 10;
  const { drivers, total } = await getDriversPage(page, pageSize);

  return <div className="flex flex-col gap-10"><div><h1 className="text-4xl font-display font-bold text-navy-deep">Master Driver</h1><p className="mt-2 text-foreground/60">Kelola driver yang dapat ditugaskan ke jadwal perjalanan.</p></div><DriverManager initialDrivers={drivers} total={total} /><Pagination total={total} pageSize={pageSize} currentPage={page} /></div>;
}
