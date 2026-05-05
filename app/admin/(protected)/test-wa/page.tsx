"use client";

import { useState } from "react";
import { testWA } from "@/app/actions/test-wa";

export default function WATestPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await testWA(formData);
      setStatus(res);
    } catch (err: any) {
      setStatus({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-navy-deep">Test WhatsApp StarSender</h1>
        <p className="text-foreground/60 text-sm">Gunakan halaman ini untuk memastikan integrasi API StarSender sudah berjalan.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-ambient border border-outline-ghost flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Nomor WA Tujuan</label>
          <input 
            name="phone" 
            type="text" 
            placeholder="Contoh: 08123456789 atau 628123456789" 
            className="w-full p-4 rounded-xl border border-outline-ghost outline-none focus:border-gold-warm"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">Pesan Test</label>
          <textarea 
            name="message" 
            rows={4}
            placeholder="Ketik pesan test di sini..." 
            className="w-full p-4 rounded-xl border border-outline-ghost outline-none focus:border-gold-warm"
            defaultValue="Halo! Ini adalah pesan test dari sistem El Travelin menggunakan StarSender API. Jika Anda menerima ini, berarti integrasi sudah BERHASIL."
            required
          />
        </div>

        <button 
          disabled={loading}
          className="btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Sedang Mengirim..." : <><i className="ri-whatsapp-line text-lg"></i> Kirim Test Pesan</>}
        </button>

        {status && (
          <div className={`p-4 rounded-xl text-sm font-medium ${status.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.success ? (
              <div className="flex flex-col gap-2">
                <p>✅ Berhasil! Pesan telah dikirim ke API StarSender.</p>
                <pre className="text-[10px] bg-black/5 p-2 rounded overflow-auto">
                  {JSON.stringify(status.result, null, 2)}
                </pre>
              </div>
            ) : (
              <p>❌ Gagal: {status.error}</p>
            )}
          </div>
        )}
      </form>

      <div className="p-6 bg-gold-soft/20 rounded-2xl border border-gold-warm/20">
        <h3 className="text-sm font-bold text-navy-deep mb-2 flex items-center gap-2">
          <i className="ri-information-line"></i> Info Penting
        </h3>
        <ul className="text-xs text-navy-deep/70 flex flex-col gap-2 list-disc pl-4">
          <li>Pastikan <b>STARSENDER_API_KEY</b> sudah ada di file .env</li>
          <li>Pastikan device di StarSender sudah dalam status <b>Connected</b>.</li>
          <li>Format nomor akan dikonversi otomatis ke format internasional (62...).</li>
        </ul>
      </div>
    </div>
  );
}
