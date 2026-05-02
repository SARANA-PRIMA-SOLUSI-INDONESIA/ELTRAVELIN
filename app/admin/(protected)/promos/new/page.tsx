"use client";

import { createPromo } from "@/app/actions/admin-promo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewPromo() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || discountValue <= 0) return;

    setLoading(true);
    try {
      await createPromo({
        code,
        discountType,
        discountValue,
        minOrder,
        maxDiscount,
      });
      router.push("/admin/promos");
    } catch (error) {
      alert("Gagal membuat promo: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/promos" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Buat Promo Baru</h1>
          <p className="text-sm text-foreground/60">Tentukan diskon menarik untuk meningkatkan pesanan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kode Promo</label>
            <input 
              type="text" 
              placeholder="Contoh: ELTRAVEL2026"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Tipe Diskon</label>
              <select 
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
              >
                <option value="FIXED">Potongan Tetap (Rp)</option>
                <option value="PERCENT">Persentase (%)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Nilai Diskon</label>
              <input 
                type="number" 
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Min. Transaksi (Rp)</label>
              <input 
                type="number" 
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Maks. Diskon (Rp)</label>
              <input 
                type="number" 
                value={maxDiscount || ''}
                onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Opsional"
                className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                disabled={discountType === 'FIXED'}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Promo"}
        </button>
      </form>
    </div>
  );
}
