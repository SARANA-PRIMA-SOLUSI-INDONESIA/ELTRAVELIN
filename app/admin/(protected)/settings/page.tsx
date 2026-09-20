"use client";

import { showSuccess, showError } from "@/lib/swal";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getGimmickMarkupSettings,
  getPickupSettings,
  updateGimmickMarkupSettings,
  updatePickupSettings,
} from "@/app/actions/admin-settings";
import type { PickupCity, PickupConfig } from "@/lib/pickup";

const PickupMap = dynamic(() => import("@/components/PickupMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-2xl bg-surface-low animate-pulse" />,
});

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [percent, setPercent] = useState(10);

  const [pickup, setPickup] = useState<PickupConfig | null>(null);
  const [pickupSaving, setPickupSaving] = useState(false);

  useEffect(() => {
    Promise.all([getGimmickMarkupSettings(), getPickupSettings()])
      .then(([s, p]) => {
        setEnabled(s.enabled);
        setPercent(s.percent);
        setPickup(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateCity = (index: number, patch: Partial<PickupCity>) => {
    setPickup((prev) => {
      if (!prev) return prev;
      const cities = prev.cities.map((city, i) => (i === index ? { ...city, ...patch } : city));
      return { ...prev, cities };
    });
  };

  const updateZone = (
    cityIndex: number,
    zoneIndex: number,
    patch: { label?: string; maxKm?: number; feePerPax?: number }
  ) => {
    setPickup((prev) => {
      if (!prev) return prev;
      const cities = prev.cities.map((city, i) => {
        if (i !== cityIndex) return city;
        const zones = city.zones.map((zone, z) =>
          z === zoneIndex ? { ...zone, ...patch } : zone
        );
        return { ...city, zones };
      });
      return { ...prev, cities };
    });
  };

  const addCity = () => {
    setPickup((prev) => {
      if (!prev) return prev;
      const city: PickupCity = {
        name: "",
        matchKeyword: "",
        poolLat: -6.2,
        poolLng: 106.816666,
        notes: "",
        zones: [{ label: "Zona 1 (0-5 km)", maxKm: 5, feePerPax: 0 }],
      };
      return { ...prev, cities: [...prev.cities, city] };
    });
  };

  const removeCity = (index: number) => {
    setPickup((prev) => {
      if (!prev) return prev;
      return { ...prev, cities: prev.cities.filter((_, i) => i !== index) };
    });
  };

  const addZone = (cityIndex: number) => {
    setPickup((prev) => {
      if (!prev) return prev;
      const cities = prev.cities.map((city, i) =>
        i === cityIndex
          ? { ...city, zones: [...city.zones, { label: "", maxKm: 5, feePerPax: 0 }] }
          : city
      );
      return { ...prev, cities };
    });
  };

  const removeZone = (cityIndex: number, zoneIndex: number) => {
    setPickup((prev) => {
      if (!prev) return prev;
      const cities = prev.cities.map((city, i) =>
        i === cityIndex
          ? { ...city, zones: city.zones.filter((_, z) => z !== zoneIndex) }
          : city
      );
      return { ...prev, cities };
    });
  };

  const handlePickupSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup) return;

    const invalidCity = pickup.cities.find((city) => !city.name.trim() || city.zones.length === 0);
    if (invalidCity) {
      await showError({ title: "Gagal", text: "Setiap kota wajib punya nama dan minimal satu zona." });
      return;
    }

    setPickupSaving(true);
    try {
      const saved = await updatePickupSettings(pickup);
      setPickup(saved);
      await showSuccess({ title: "Berhasil", text: "Pengaturan layanan jemput disimpan." });
    } catch (err) {
      await showError({ title: "Gagal", text: (err as Error).message || "Gagal menyimpan pengaturan jemput" });
    } finally {
      setPickupSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateGimmickMarkupSettings({ percent, enabled });
      setPercent(result.percent);
      setEnabled(result.enabled);
      await showSuccess({ title: "Berhasil", text: "Pengaturan berhasil disimpan." });
    } catch (err: any) {
      await showError({ title: "Gagal", text: err.message || "Gagal menyimpan pengaturan" });
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

      {pickup && (
        <form
          onSubmit={handlePickupSave}
          className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-display font-bold text-navy-deep">Layanan Jemput (Booking Travel)</h2>
            <p className="text-xs text-foreground/50">
              Kota jemput mengikuti kota keberangkatan rute. Biaya = tarif zona × jumlah penumpang.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 p-5 bg-surface-low rounded-2xl">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-navy-deep">Aktifkan Layanan Jemput</span>
              <span className="text-xs text-foreground/50">
                Jika nonaktif, opsi jemput tidak muncul di checkout & booking manual.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPickup((prev) => (prev ? { ...prev, enabled: !prev.enabled } : prev))}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                pickup.enabled ? "bg-navy-deep" : "bg-gray-300"
              }`}
              aria-pressed={pickup.enabled}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  pickup.enabled ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {pickup.cities.map((city, cityIndex) => (
            <div key={cityIndex} className="border border-outline-ghost rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">
                  Kota #{cityIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeCity(cityIndex)}
                  className="text-xs font-bold text-red-500 hover:opacity-80"
                >
                  Hapus Kota
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Nama Kota</label>
                  <input
                    type="text"
                    value={city.name}
                    onChange={(e) => updateCity(cityIndex, { name: e.target.value })}
                    placeholder="Bandung"
                    className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">
                    Kata Kunci Rute/Titik Naik (pisah koma)
                  </label>
                  <input
                    type="text"
                    value={city.matchKeyword}
                    onChange={(e) => updateCity(cityIndex, { matchKeyword: e.target.value })}
                    placeholder="Jakarta, Soekarno Hatta"
                    className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">
                  Titik Pool ({city.name || "kota ini"}) — klik peta untuk memindahkan
                </span>
                <PickupMap
                  centerLat={city.poolLat ?? -6.2}
                  centerLng={city.poolLng ?? 106.816666}
                  value={
                    Number.isFinite(city.poolLat) && Number.isFinite(city.poolLng)
                      ? { lat: city.poolLat as number, lng: city.poolLng as number }
                      : null
                  }
                  onChange={(point) => updateCity(cityIndex, { poolLat: point.lat, poolLng: point.lng })}
                  zones={city.zones}
                  className="h-64 w-full rounded-2xl overflow-hidden z-0"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Latitude Pool</label>
                    <input
                      type="number"
                      step="any"
                      value={city.poolLat ?? ""}
                      onChange={(e) => updateCity(cityIndex, { poolLat: e.target.value === "" ? undefined : Number(e.target.value) })}
                      className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Longitude Pool</label>
                    <input
                      type="number"
                      step="any"
                      value={city.poolLng ?? ""}
                      onChange={(e) => updateCity(cityIndex, { poolLng: e.target.value === "" ? undefined : Number(e.target.value) })}
                      className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Catatan untuk Customer</label>
                <input
                  type="text"
                  value={city.notes || ""}
                  onChange={(e) => updateCity(cityIndex, { notes: e.target.value })}
                  placeholder="Tentukan titik jemput di peta. Alamat dipakai sebagai patokan driver."
                  className="bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">
                  Zona (maks km dari pool) & Tarif per Penumpang
                </span>
                {city.zones.map((zone, zoneIndex) => (
                  <div
                    key={zoneIndex}
                    className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center bg-surface-low/50 p-3 rounded-2xl"
                  >
                    <input
                      type="text"
                      value={zone.label}
                      onChange={(e) => updateZone(cityIndex, zoneIndex, { label: e.target.value })}
                      placeholder="Zona 1 (0-5 km)"
                      className="w-full bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border border-outline-ghost sm:flex-1 sm:min-w-[10rem]"
                      required
                    />
                    <input
                      type="number"
                      min={0.5}
                      step="0.5"
                      value={zone.maxKm}
                      onChange={(e) => updateZone(cityIndex, zoneIndex, { maxKm: Number(e.target.value) || 0 })}
                      placeholder="Maks km"
                      className="w-full sm:w-24 bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border border-outline-ghost"
                      required
                    />
                    <input
                      type="number"
                      min={0}
                      value={zone.feePerPax}
                      onChange={(e) => updateZone(cityIndex, zoneIndex, { feePerPax: Number(e.target.value) || 0 })}
                      placeholder="Tarif/pax"
                      className="w-full sm:w-36 bg-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border border-outline-ghost"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeZone(cityIndex, zoneIndex)}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl border border-red-200 bg-white text-red-500 text-xs font-bold hover:bg-red-50 shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addZone(cityIndex)}
                  className="self-start text-xs font-bold text-navy-deep hover:text-gold-warm transition-colors"
                >
                  + Tambah Zona
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCity}
            className="self-start px-6 py-3 rounded-xl border border-outline-ghost text-navy-deep font-bold text-xs hover:border-gold-soft transition-all"
          >
            + Tambah Kota
          </button>

          <button
            type="submit"
            disabled={pickupSaving}
            className="btn-primary py-4 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
          >
            {pickupSaving ? "Menyimpan..." : "Simpan Pengaturan Jemput"}
          </button>
        </form>
      )}
    </div>
  );
}
