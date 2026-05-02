"use client";

import { triggerSyncSchedules } from "@/app/actions/admin-master";
import { useState } from "react";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!confirm("Generate jadwal baru untuk 7 hari ke depan?")) return;
    
    setLoading(true);
    try {
      await triggerSyncSchedules(7);
      alert("Jadwal berhasil disinkronkan!");
    } catch (error) {
      alert("Gagal sinkronisasi: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className="bg-navy-deep text-white px-8 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-gold-warm transition-all disabled:opacity-50"
    >
      <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
      {loading ? 'Syncing...' : 'Sinkronkan Jadwal'}
    </button>
  );
}
