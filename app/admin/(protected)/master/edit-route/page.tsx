"use client";

import { getRouteById, updateRoute } from "@/app/actions/admin-master";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { showError } from "@/lib/swal";

function EditRouteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  useEffect(() => {
    if (!id) return;
    getRouteById(id).then(route => {
      if (route) {
        setOrigin(route.origin);
        setDestination(route.destination);
      }
      setFetching(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !origin || !destination) return;

    setLoading(true);
    try {
      await updateRoute(id, origin, destination);
      router.push(id ? `/admin/master#route-${id}` : "/admin/master");
    } catch (error) {
      await showError({ title: "Gagal", text: "Gagal mengupdate rute: " + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const backHref = id ? `/admin/master#route-${id}` : "/admin/master";

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat data rute...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="w-10 h-10 rounded-full bg-white border border-outline-ghost flex items-center justify-center text-navy-deep hover:bg-navy-deep hover:text-white transition-all">
          <i className="ri-arrow-left-line"></i>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-bold text-navy-deep">Edit Rute</h1>
          <p className="text-sm text-foreground/60">Ubah nama kota asal dan tujuan rute.</p>
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

        <div className="flex gap-4">
          <Link
            href={backHref}
            className="flex-1 bg-surface-low rounded-xl py-4 font-bold text-sm text-navy-deep text-center border border-outline-ghost hover:bg-surface-medium transition-all"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditRoute() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading...</div>}>
      <EditRouteForm />
    </Suspense>
  );
}