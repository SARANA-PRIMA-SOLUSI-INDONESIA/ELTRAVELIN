"use client";

import { useState } from "react";
import { triggerCron } from "@/app/actions/trigger-cron";

export default function CronTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrigger = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await triggerCron();
      setResult(res);
    } catch (error) {
      setResult({ error: "Failed to trigger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline-ghost">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-bold text-navy-deep">Sistem Reminder</h3>
          <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest">Otomatisasi WhatsApp</p>
        </div>
        <button 
          onClick={handleTrigger}
          disabled={loading}
          className="bg-navy-deep text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-navy-deep/90 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <i className="ri-refresh-line"></i>
          )}
          Trigger Pengecekan
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-40 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {!result && !loading && (
        <p className="text-[11px] text-foreground/60 italic">
          Klik tombol di atas untuk menjalankan pengecekan reminder (15m, 25m, 35m) secara manual sekarang.
        </p>
      )}
    </div>
  );
}
