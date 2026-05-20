"use client";

import { useState, useRef } from "react";
import { updateBanner } from "@/app/actions/banner";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BannerForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageUrl || "/promo-banner.png");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", initialData?.id || "");
      formData.append("isActive", String(isActive));
      formData.append("imageUrl", initialData?.imageUrl || "/promo-banner.png");
      
      if (selectedFile) {
        formData.append("imageFile", selectedFile);
      }

      const res = await updateBanner(formData);
      if (res && !res.success) {
        console.error("Update banner error:", res.error);
        alert(`Gagal memperbarui banner: ${res.error}`);
      } else {
        router.refresh();
        alert("Banner berhasil diperbarui!");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Gagal memperbarui banner: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-4">
        <label className="text-sm font-bold text-navy-deep uppercase tracking-widest">Gambar Banner</label>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden border-2 border-dashed border-outline-ghost hover:border-gold-warm transition-all cursor-pointer group bg-surface-low"
        >
          {previewUrl ? (
            <Image 
              src={previewUrl} 
              alt="Preview" 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-foreground/40">
              <i className="ri-image-add-line text-5xl"></i>
              <span className="font-bold">Klik untuk pilih gambar</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 px-6 py-3 rounded-full font-bold text-navy-deep text-sm flex items-center gap-2">
              <i className="ri-upload-2-line"></i>
              Ganti Gambar
            </div>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-4 py-4 bg-surface-low px-8 rounded-2xl border border-outline-ghost w-fit">
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-gold-warm' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
        </button>
        <span className="text-sm font-bold text-navy-deep">Tampilkan di Halaman Utama</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary py-5 rounded-2xl font-bold shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 w-full md:w-fit md:px-12"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Menyimpan...
          </>
        ) : (
          "Simpan Perubahan"
        )}
      </button>
    </form>
  );
}
