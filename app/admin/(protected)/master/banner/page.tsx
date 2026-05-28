import { prisma } from "@/lib/prisma";
import BannerForm from "@/components/admin/BannerForm";

export const dynamic = 'force-dynamic';

export default async function AdminBannerPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pengaturan Banner</h1>
        <p className="text-foreground/60">Kelola promo yang muncul di slider halaman utama.</p>
        <div className="flex flex-col gap-2 mt-3 bg-surface-low p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <i className="ri-image-line text-gold-warm"></i>
            <span className="text-xs font-bold text-navy-deep">Panduan Ukuran Banner (1 Gambar untuk Desktop & Mobile)</span>
          </div>
          <ul className="text-xs text-foreground/60 space-y-1 ml-6 list-disc">
            <li><strong>Ukuran:</strong> 1200 x 600 px (rasio 2:1)</li>
            <li><strong>Safe Zone:</strong> Tempatkan teks/promo di tengah 800 x 400 px</li>
            <li><strong>Area pinggir (kiri/kanan 200px):</strong> Bisa terpotong di mobile</li>
            <li><strong>Format:</strong> JPG/PNG, max 5MB</li>
          </ul>
          <div className="mt-2 p-3 bg-white rounded-lg border border-dashed border-gold-warm/50">
            <div className="text-[10px] text-foreground/40 text-center">
              <div className="flex justify-center gap-1 mb-1">
                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded">Potong (200px)</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded font-bold">Safe Zone (800px)</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded">Potong (200px)</span>
              </div>
              Desktop (1200px) = Full image | Mobile (600px) = Safe zone saja
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Existing banners */}
        {banners.map((banner, idx) => (
          <div key={banner.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-outline-ghost">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 rounded-full bg-navy-deep text-white flex items-center justify-center font-bold text-sm">
                 {idx + 1}
               </div>
               <h2 className="text-sm font-bold text-navy-deep uppercase tracking-widest">Banner {idx + 1}</h2>
            </div>
            <BannerForm initialData={banner} />
          </div>
        ))}
        
        {/* New banner slot */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-dashed border-gold-warm">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-10 rounded-full bg-gold-warm text-white flex items-center justify-center font-bold text-sm">
               +
             </div>
             <h2 className="text-sm font-bold text-navy-deep uppercase tracking-widest">Tambah Banner Baru</h2>
          </div>
          <BannerForm initialData={null} />
        </div>
      </div>
    </div>
  );
}
