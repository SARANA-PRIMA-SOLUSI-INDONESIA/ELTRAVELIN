"use client";

import { createRoute } from "@/app/actions/admin-master";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { showError } from "@/lib/swal";

export default function NewRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setLoading(true);
    try {
      await createRoute(origin, destination);
      router.push("/admin/master");
    } catch (error) {
      await showError({ title: "Gagal", text: "Gagal membuat rute: " + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/master" className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Tambah Rute Baru</h1>
          <p className="text-sm text-foreground/60">Definisikan rute perjalanan baru untuk armada El Travelin.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kota Asal</label>
            <input 
              type="text" 
              placeholder="Contoh: Bandung (Cijagra)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Kota Tujuan</label>
            <input 
              type="text" 
              placeholder="Contoh: Jakarta (Kuningan)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Rute"}
        </button>
      </form>
    </div>
  );
}
