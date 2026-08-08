"use client";

import { updatePromoShowStatus } from "@/app/actions/admin-promo";
import { useState } from "react";
import { showError } from "@/lib/swal";

interface PromoShowToggleProps {
  id: string;
  initialStatus: boolean;
}

export default function PromoShowToggle({ id, initialStatus }: PromoShowToggleProps) {
  const [showOnCheckout, setShowOnCheckout] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const newStatus = !showOnCheckout;
      await updatePromoShowStatus(id, newStatus);
      setShowOnCheckout(newStatus);
    } catch {
      await showError({ title: "Gagal", text: "Gagal update status visibilitas checkout" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggle}
      disabled={loading}
      title={showOnCheckout ? "Ditampilkan di Checkout" : "Disembunyikan dari Checkout"}
      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
        showOnCheckout 
          ? 'bg-gold-warm/10 text-gold-warm border-gold-warm/20 hover:bg-gold-warm/20' 
          : 'bg-foreground/5 text-foreground/40 border-outline-ghost hover:bg-foreground/10'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <i className={showOnCheckout ? "ri-eye-line text-sm" : "ri-eye-off-line text-sm"}></i>
      <span>{showOnCheckout ? 'Checkout' : 'Sembunyi'}</span>
    </button>
  );
}
