import { prisma } from "@/lib/prisma";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = 'force-dynamic';

export default async function AdminBannerPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'asc' },
    take: 3
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pengaturan Banner</h1>
        <p className="text-foreground/60">Kelola hingga 3 promo yang muncul di slider halaman utama.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 rounded-full bg-navy-deep text-white flex items-center justify-center font-bold text-sm">
                 {idx + 1}
               </div>
               <h2 className="text-sm font-bold text-navy-deep uppercase tracking-widest">Slot Banner {idx + 1}</h2>
            </div>
            <BannerForm initialData={banners[idx]} />
          </div>
        ))}
      </div>
    </div>
  );
}
