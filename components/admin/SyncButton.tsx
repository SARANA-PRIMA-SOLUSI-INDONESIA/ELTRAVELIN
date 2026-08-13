"use client";

import { triggerSyncSchedules } from "@/app/actions/admin-master";
import { useState } from "react";
import { confirmAction, showSuccess, showError } from "@/lib/swal";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!(await confirmAction({ title: "Sinkronkan Jadwal", text: "Generate jadwal baru untuk 14 hari ke depan?" }))) return;
    
    setLoading(true);
    try {
      await triggerSyncSchedules(14);
      await showSuccess({ title: "Berhasil", text: "Jadwal berhasil disinkronkan!" });
    } catch (error) {
      await showError({ title: "Gagal Sinkronisasi", text: "Gagal sinkronisasi: " + (error as Error).message });
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
