"use client";

import { updatePromoStatus } from "@/app/actions/admin-promo";
import { useState } from "react";
import { showError } from "@/lib/swal";

interface PromoToggleProps {
  id: string;
  initialStatus: boolean;
}

export default function PromoToggle({ id, initialStatus }: PromoToggleProps) {
  const [isActive, setIsActive] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const newStatus = !isActive;
      await updatePromoStatus(id, newStatus);
      setIsActive(newStatus);
    } catch {
      await showError({ title: "Gagal", text: "Gagal update status" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
        isActive 
          ? 'bg-green-50 text-green-600 hover:bg-green-100' 
          : 'bg-red-50 text-red-500 hover:bg-red-100'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {isActive ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}
