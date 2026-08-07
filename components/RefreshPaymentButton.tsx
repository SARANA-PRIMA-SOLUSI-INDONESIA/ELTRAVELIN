"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshPaymentButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    setSpinning(true);
    router.refresh();
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={spinning}
      className="flex items-center gap-2 bg-gold-warm text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gold-warm/90 transition-all shadow-lg shadow-gold-warm/20 disabled:opacity-60"
    >
      <i className={`ri-refresh-line text-lg ${spinning ? "animate-spin" : ""}`}></i>
      <span>Cek Status Pembayaran</span>
    </button>
  );
}
