"use client";

import { useState } from "react";
import {
  toggleTourServiceActive,
  toggleTourServiceFeatured,
} from "@/app/actions/admin-tour";
import { showError } from "@/lib/swal";
import { useRouter } from "next/navigation";

interface TourServiceToggleProps {
  id: string;
  initialActive: boolean;
  initialFeatured: boolean;
}

export default function TourServiceToggle({
  id,
  initialActive,
  initialFeatured,
}: TourServiceToggleProps) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [featured, setFeatured] = useState(initialFeatured);
  const [loading, setLoading] = useState(false);

  const toggle = async (kind: "active" | "featured") => {
    setLoading(true);
    try {
      if (kind === "active") {
        const next = !active;
        await toggleTourServiceActive(id, next);
        setActive(next);
      } else {
        const next = !featured;
        await toggleTourServiceFeatured(id, next);
        setFeatured(next);
      }
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => toggle("active")}
        disabled={loading}
        title={active ? "Nonaktifkan layanan" : "Aktifkan layanan"}
        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
          active ? "bg-green-500/10 text-green-600" : "bg-foreground/10 text-foreground/50"
        }`}
      >
        {active ? "Aktif" : "Mati"}
      </button>
      <button
        type="button"
        onClick={() => toggle("featured")}
        disabled={loading}
        title={featured ? "Hapus dari highlight beranda" : "Jadikan highlight beranda"}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
          featured
            ? "bg-gold-soft text-navy-deep"
            : "bg-white border border-outline-ghost text-foreground/40 hover:text-navy-deep"
        }`}
      >
        <i className="ri-star-line"></i>
      </button>
    </div>
  );
}
