"use client";

import { useEffect, useState } from "react";
import {
  getGimmickMarkupSettings,
  updateGimmickMarkupSettings,
} from "@/app/actions/admin-settings";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [percent, setPercent] = useState(10);

  useEffect(() => {
    getGimmickMarkupSettings()
      .then((s) => {
        setEnabled(s.enabled);
        setPercent(s.percent);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateGimmickMarkupSettings({ percent, enabled });
      setPercent(result.percent);
      setEnabled(result.enabled);
      alert("Pengaturan berhasil disimpan.");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <p className="text-sm text-foreground/40 font-medium">Memuat pengaturan...</p>
      </div>
    );
  }

  const previewBase = 75000;
  const previewGimmick = Math.round(previewBase * (1 + percent / 100));

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Pengaturan</h1>
        <p className="text-foreground/60">
          Atur tampilan harga gimmick (harga coret) pada hasil pencarian jadwal.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8"
      >
        <div className="flex items-center justify-between gap-4 p-5 bg-surface-low rounded-2xl">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-navy-deep">Tampilkan Harga Gimmick</span>
            <span className="text-xs text-foreground/50">
              Jika aktif, harga coret muncul di atas harga asli pada kartu jadwal.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              enabled ? "bg-navy-deep" : "bg-gray-300"
            }`}
            aria-pressed={enabled}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy-deep uppercase tracking-widest">
            Markup Persen (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            disabled={!enabled}
            className="bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none disabled:opacity-50 font-bold"
          />
          <p className="text-[11px] text-foreground/50">
            Default 10. Harga gimmick = harga asli × (1 + persen/100).
          </p>
        </div>

        <div className="bg-surface-low p-5 rounded-2xl flex flex-col gap-2">
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
            Preview
          </span>
          {enabled ? (
            <div className="flex flex-col items-start">
              <span className="text-sm text-foreground/40 line-through">
                Rp {previewGimmick.toLocaleString("id-ID")}
              </span>
              <span className="text-xl font-display font-bold text-navy-deep">
                Rp {previewBase.toLocaleString("id-ID")}
              </span>
            </div>
          ) : (
            <span className="text-xl font-display font-bold text-navy-deep">
              Rp {previewBase.toLocaleString("id-ID")}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>
    </div>
  );
}
