import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PromoToggle from "@/components/admin/PromoToggle";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = 'force-dynamic';

export default async function AdminPromos() {
  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Manajemen Promo</h1>
          <p className="text-foreground/60">Buat dan kelola kode promo untuk pelanggan Anda.</p>
        </div>
        <Link href="/admin/promos/new" className="btn-primary px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
          <i className="ri-add-line"></i>
          Buat Promo Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promos.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-outline-ghost">
            <p className="text-sm text-foreground/40 font-medium">Belum ada kode promo aktif.</p>
          </div>
        ) : (
          promos.map((promo: any) => (
            <div key={promo.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-transparent hover:border-gold-soft transition-all flex flex-col gap-6 group">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-display font-bold text-navy-deep tracking-wider">{promo.code}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Kode Promo</span>
                    {/* Status Badge */}
                    {(() => {
                      const now = new Date();
                      const isExpired = promo.endDate && new Date(promo.endDate) < now;
                      const isFull = promo.usageLimit && promo.usedCount >= promo.usageLimit;
                      
                      if (!promo.isActive) return <span className="text-[9px] bg-foreground/10 text-foreground/60 px-2 py-0.5 rounded-full">MATI</span>;
                      if (isExpired) return <span className="text-[9px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">KEDALUWARSA</span>;
                      if (isFull) return <span className="text-[9px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">KUOTA HABIS</span>;
                      return <span className="text-[9px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">AKTIF</span>;
                    })()}
                  </div>
                </div>
                <div className="flex gap-2">
                   <PromoToggle id={promo.id} initialStatus={promo.isActive} />
                   <DeleteButton id={promo.id} type="promo" />
                </div>
              </div>

              <div className="bg-surface-low p-6 rounded-2xl flex flex-col gap-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Diskon</span>
                    <span className="font-bold text-navy-deep">
                       {promo.discountType === 'FIXED' ? `Rp ${promo.discountValue.toLocaleString('id-ID')}` : `${promo.discountValue}%`}
                    </span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Kuota</span>
                    <span className="font-bold text-navy-deep">
                       {promo.usageLimit ? `${promo.usedCount} / ${promo.usageLimit}` : '∞ (Tak Terbatas)'}
                    </span>
                 </div>
                 {promo.startDate && (
                   <div className="flex justify-between text-sm">
                      <span className="text-foreground/60">Masa Berlaku</span>
                      <span className="font-bold text-navy-deep text-[11px]">
                         {new Date(promo.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {promo.endDate ? new Date(promo.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }) : '∞'}
                      </span>
                   </div>
                 )}
                 <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Min. Order</span>
                    <span className="font-bold text-navy-deep">Rp {promo.minOrder.toLocaleString('id-ID')}</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-outline-ghost flex justify-between items-center text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                 <span>Dibuat pada</span>
                 <span>{new Date(promo.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
