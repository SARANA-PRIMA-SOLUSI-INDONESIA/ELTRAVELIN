"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showError, showSuccess } from "@/lib/swal";
import {
  createTourService,
  updateTourService,
  uploadTourServiceImage,
  type TourServiceInput,
} from "@/app/actions/admin-tour";
import { TOUR_PRICE_UNIT_LABELS } from "@/lib/tour";

interface VehicleOption {
  id: string;
  name: string;
  plateNumber: string;
}

interface TourServiceFormProps {
  vehicles: VehicleOption[];
  initial?: Partial<TourServiceInput> & { id?: string };
}

const EMPTY: TourServiceInput = {
  type: "TOUR_PACKAGE",
  name: "",
  shortDesc: "",
  description: "",
  destinations: "",
  durationLabel: "",
  durationDays: null,
  durationNights: null,
  itinerary: "",
  facilities: "",
  includes: "",
  excludes: "",
  basePrice: 0,
  priceUnit: "PER_PAX",
  minPax: 1,
  maxPax: null,
  vehicleId: null,
  imageUrl: "",
  gallery: "",
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

export default function TourServiceForm({ vehicles, initial }: TourServiceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<TourServiceInput>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof TourServiceInput>(key: K, value: TourServiceInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadTourServiceImage(fd);
      if (!result.success) throw new Error(result.error);
      set("imageUrl", result.url);
      await showSuccess({ title: "Berhasil", text: "Gambar berhasil diunggah." });
    } catch (error) {
      await showError({ title: "Gagal Upload", text: (error as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const galleryList = (form.gallery || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const removeGalleryAt = (index: number) => {
    set("gallery", galleryList.filter((_, i) => i !== index).join("\n"));
  };

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    const next = [...galleryList];
    let failed = 0;
    try {
      for (const file of Array.from(files)) {
        if (next.length >= 3) break;
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadTourServiceImage(fd);
        if (result.success) next.push(result.url);
        else failed += 1;
      }
      set("gallery", next.join("\n"));
      if (failed > 0) {
        await showError({ title: "Sebagian Gagal", text: `${failed} gambar gagal diunggah.` });
      }
    } catch (error) {
      await showError({ title: "Gagal Upload", text: (error as Error).message });
    } finally {
      setUploadingGallery(false);
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      await showError({ title: "Gagal", text: "Nama layanan wajib diisi." });
      return;
    }
    if (!form.basePrice || form.basePrice <= 0) {
      await showError({ title: "Gagal", text: "Harga dasar wajib diisi." });
      return;
    }

    setSaving(true);
    try {
      if (initial?.id) {
        await updateTourService(initial.id, form);
      } else {
        await createTourService(form);
      }
      router.push("/admin/tour");
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "bg-surface-low rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none";
  const labelClass =
    "text-xs font-bold text-navy-deep uppercase tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-outline-ghost flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Jenis Layanan</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className={inputClass}
          >
            <option value="TOUR_PACKAGE">Paket Tour</option>
            <option value="DAILY_RENTAL">Sewa Harian</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Nama Layanan</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Contoh: Tour Bandung 3H2M"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Deskripsi Singkat</label>
        <input
          type="text"
          value={form.shortDesc || ""}
          onChange={(e) => set("shortDesc", e.target.value)}
          placeholder="Muncul di kartu katalog"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>Deskripsi Lengkap</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Destinasi</label>
          <input
            type="text"
            value={form.destinations || ""}
            onChange={(e) => set("destinations", e.target.value)}
            placeholder="Bandung, Lembang, Ciwidey"
            className={inputClass}
          />
          <p className="text-[10px] text-foreground/40">Pisahkan dengan koma.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Durasi (Label)</label>
          <input
            type="text"
            value={form.durationLabel || ""}
            onChange={(e) => set("durationLabel", e.target.value)}
            placeholder="3 Hari 2 Malam"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Hari</label>
            <input
              type="number"
              min={1}
              value={form.durationDays ?? ""}
              onChange={(e) => set("durationDays", e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Malam</label>
            <input
              type="number"
              min={0}
              value={form.durationNights ?? ""}
              onChange={(e) => set("durationNights", e.target.value ? Number(e.target.value) : null)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Harga Dasar (Rp)</label>
          <input
            type="number"
            min={0}
            value={form.basePrice || ""}
            onChange={(e) => set("basePrice", Number(e.target.value))}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Satuan Harga</label>
          <select
            value={form.priceUnit}
            onChange={(e) => set("priceUnit", e.target.value)}
            className={inputClass}
          >
            {Object.entries(TOUR_PRICE_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Urutan Tampil</label>
          <input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Min. Peserta (per unit)</label>
          <input
            type="number"
            min={1}
            value={form.minPax ?? 1}
            onChange={(e) => set("minPax", Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Maks. Peserta per Unit</label>
          <input
            type="number"
            min={1}
            value={form.maxPax ?? ""}
            onChange={(e) => set("maxPax", e.target.value ? Number(e.target.value) : null)}
            placeholder="Opsional"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Armada (Opsional)</label>
          <select
            value={form.vehicleId || ""}
            onChange={(e) => set("vehicleId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">— Tidak ditentukan —</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} ({vehicle.plateNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Itinerary</label>
          <textarea
            value={form.itinerary || ""}
            onChange={(e) => set("itinerary", e.target.value)}
            rows={6}
            placeholder={"Hari 1: Penjemputan & City Tour\nHari 2: Lembang & Farmhouse"}
            className={inputClass}
          />
          <p className="text-[10px] text-foreground/40">Satu baris per agenda.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Fasilitas</label>
          <textarea
            value={form.facilities || ""}
            onChange={(e) => set("facilities", e.target.value)}
            rows={6}
            placeholder={"AC\nWiFi\nUSB Charging"}
            className={inputClass}
          />
          <p className="text-[10px] text-foreground/40">Satu baris per item.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Include / Exclude</label>
          <textarea
            value={form.includes || ""}
            onChange={(e) => set("includes", e.target.value)}
            rows={2}
            placeholder="Include: tiket masuk, makan"
            className={inputClass}
          />
          <textarea
            value={form.excludes || ""}
            onChange={(e) => set("excludes", e.target.value)}
            rows={2}
            placeholder="Exclude: pengeluaran pribadi"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-outline-ghost pt-8">
        <div className="flex flex-col gap-4">
          <label className={labelClass}>Gambar Utama</label>
          <div className="flex flex-col gap-3 bg-surface-low p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <i className="ri-image-line text-lg text-gold-warm"></i>
              <span className="text-sm font-bold text-navy-deep">Panduan Ukuran Gambar Utama</span>
            </div>
            <ul className="text-sm text-foreground/70 space-y-1.5 ml-6 list-disc">
              <li>
                <strong className="text-navy-deep">Ukuran:</strong> 1920 x 1080 px (rasio 16:9), maks 3 MB
              </li>
              <li>
                <strong className="text-navy-deep">Rasio 16:9 tampil utuh</strong> tanpa potong di card katalog, hero
                halaman detail, dan daftar admin
              </li>
              <li>
                <strong className="text-navy-deep">Rasio lain</strong> (4:3, 1:1, 9:16) akan terpotong otomatis
              </li>
            </ul>
            <div className="p-3 bg-white rounded-lg border border-dashed border-gold-warm/50">
              <div className="flex justify-center mb-2">
                <span className="w-full text-center px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                  16:9 = Tampil Penuh
                </span>
              </div>
              <div className="text-xs text-foreground/50 text-center">
                Jangan menempelkan teks/objek penting ke tepi gambar
              </div>
            </div>
          </div>
          {form.imageUrl ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-low">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-surface-low border-2 border-dashed border-outline-ghost flex items-center justify-center">
              <span className="text-xs text-foreground/40 font-bold uppercase tracking-widest">Belum ada gambar</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-5 py-3 rounded-xl bg-navy-deep text-white text-xs font-bold hover:bg-navy-deep/90 transition-all disabled:opacity-50"
            >
              {uploading ? "Mengunggah..." : "Upload Gambar"}
            </button>
            {form.imageUrl && (
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                className="px-5 py-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-all"
              >
                Hapus
              </button>
            )}
          </div>
          <input
            type="text"
            value={form.imageUrl || ""}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="atau tempel URL gambar di sini"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <label className={labelClass}>Galeri (Maks 3 Gambar)</label>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={uploadingGallery || galleryList.length >= 3}
                className="px-4 py-2 rounded-xl bg-navy-deep text-white text-xs font-bold hover:bg-navy-deep/90 transition-all disabled:opacity-50"
              >
                {uploadingGallery ? "Mengunggah..." : "Upload Gambar"}
              </button>
            </div>
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleGalleryUpload(e.target.files);
              }}
            />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: Math.max(3, galleryList.length) }).map((_, index) => {
                const url = galleryList[index];
                return (
                  <div key={index} className="flex flex-col gap-2">
                    {url ? (
                      <>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-low">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Galeri ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGalleryAt(index)}
                          className="py-1.5 rounded-lg bg-red-50 text-red-500 text-[10px] font-bold hover:bg-red-100 transition-all"
                        >
                          Hapus
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => galleryRef.current?.click()}
                        className="w-full aspect-video rounded-xl bg-surface-low border-2 border-dashed border-outline-ghost flex items-center justify-center text-foreground/30 hover:border-gold-warm hover:text-gold-warm transition-all"
                        aria-label={`Upload gambar galeri ${index + 1}`}
                      >
                        <i className="ri-add-line text-xl"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-foreground/40">
              Rasio 16:9 (mis. 1280 x 720 px), maks 3 MB per gambar. Bisa pilih 3 file sekaligus.
            </p>
          </div>

          <div className="flex items-center justify-between bg-surface-low rounded-xl px-6 py-4">
            <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">Aktif</span>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative w-14 h-8 rounded-full transition-colors ${form.isActive ? "bg-navy-deep" : "bg-gray-300"}`}
              aria-pressed={form.isActive}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-6" : ""}`} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-surface-low rounded-xl px-6 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-navy-deep uppercase tracking-widest">Highlight di Beranda</span>
              <span className="text-[10px] text-foreground/50">Tampil di section Tour & Sewa homepage</span>
            </div>
            <button
              type="button"
              onClick={() => set("isFeatured", !form.isFeatured)}
              className={`relative w-14 h-8 rounded-full transition-colors ${form.isFeatured ? "bg-gold-warm" : "bg-gray-300"}`}
              aria-pressed={form.isFeatured}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${form.isFeatured ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="btn-primary py-4 px-10 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Layanan"}
        </button>
        <Link
          href="/admin/tour"
          className="py-4 px-8 rounded-xl font-bold text-sm text-navy-deep hover:bg-surface-low transition-all"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
