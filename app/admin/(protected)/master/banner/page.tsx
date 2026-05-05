import { prisma } from "@/lib/prisma";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = 'force-dynamic';

export default async function AdminBannerPage() {
  const banner = await prisma.banner.findFirst();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pengaturan Banner</h1>
        <p className="text-foreground/60">Kelola promo yang muncul di halaman utama.</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost">
        <BannerForm initialData={banner} />
      </div>
    </div>
  );
}
