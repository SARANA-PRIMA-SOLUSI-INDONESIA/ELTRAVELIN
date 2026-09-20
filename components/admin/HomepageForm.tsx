"use client";

import { useRef, useState } from "react";
import {
  resetHomepageSection,
  updateHomepageSection,
  uploadHomepageImage,
} from "@/app/actions/admin-homepage";
import { confirmAction, showError, showSuccess } from "@/lib/swal";
import {
  DEFAULT_HOMEPAGE,
  type HomepageContent,
  type HomepagePriorityItem,
  type HomepageSectionKey,
  type HomepageTestimonialItem,
} from "@/lib/homepage-defaults";

interface HomepageFormProps {
  initial: HomepageContent;
}

const inputClass =
  "bg-surface-low rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-warm outline-none border-none w-full";
const labelClass = "text-[10px] font-bold text-navy-deep uppercase tracking-widest";

export default function HomepageForm({ initial }: HomepageFormProps) {
  const [content, setContent] = useState<HomepageContent>(initial);
  const [openSection, setOpenSection] = useState<HomepageSectionKey | null>("hero");
  const [saving, setSaving] = useState<HomepageSectionKey | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const patch = <K extends HomepageSectionKey>(section: K, value: Partial<HomepageContent[K]>) =>
    setContent((prev) => ({ ...prev, [section]: { ...prev[section], ...value } }));

  const save = async (section: HomepageSectionKey) => {
    setSaving(section);
    try {
      await updateHomepageSection(section, content[section] as unknown as Record<string, unknown>);
      await showSuccess({ title: "Berhasil", text: "Konten homepage disimpan." });
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const reset = async (section: HomepageSectionKey) => {
    const confirmed = await confirmAction({
      title: "Reset Section",
      danger: true,
      text: "Kembalikan section ini ke konten default?",
    });
    if (!confirmed) return;

    setSaving(section);
    try {
      await resetHomepageSection(section);
      setContent((prev) => ({ ...prev, [section]: DEFAULT_HOMEPAGE[section] }));
      await showSuccess({ title: "Berhasil", text: "Section dikembalikan ke default." });
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const uploadPriorityImage = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadHomepageImage(fd);
      if (!result.success) throw new Error(result.error);
      const items = [...content.priorities.items];
      items[index] = { ...items[index], image: result.url };
      patch("priorities", { items });
    } catch (error) {
      await showError({ title: "Gagal Upload", text: (error as Error).message });
    } finally {
      setUploadingIndex(null);
    }
  };

  const renderSection = (
    key: HomepageSectionKey,
    title: string,
    children: React.ReactNode
  ) => (
    <div key={key} className="bg-white rounded-[2rem] border border-outline-ghost overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenSection((prev) => (prev === key ? null : key))}
        className="w-full flex items-center justify-between px-8 py-6 hover:bg-surface-low transition-colors"
      >
        <span className="text-lg font-display font-bold text-navy-deep">{title}</span>
        <i className={`ri-arrow-down-s-line text-xl text-foreground/40 transition-transform ${openSection === key ? "rotate-180" : ""}`}></i>
      </button>

      {openSection === key && (
        <div className="px-8 pb-8 flex flex-col gap-5 border-t border-outline-ghost pt-6">
          {children}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => save(key)}
              disabled={saving === key}
              className="btn-primary px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50"
            >
              {saving === key ? "Menyimpan..." : "Simpan Section"}
            </button>
            <button
              type="button"
              onClick={() => reset(key)}
              disabled={saving === key}
              className="px-6 py-3.5 rounded-xl bg-surface-low text-foreground/60 font-bold text-sm hover:text-navy-deep transition-all disabled:opacity-50"
            >
              Reset Default
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const priorityItems = content.priorities.items;
  const testimonialItems = content.testimonials.items;

  return (
    <div className="flex flex-col gap-6">
      {renderSection(
        "hero",
        "Hero (Banner Utama)",
        <>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Badge</label>
            <input type="text" value={content.hero.badge} onChange={(e) => patch("hero", { badge: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Judul Baris 1</label>
              <input type="text" value={content.hero.titleTop} onChange={(e) => patch("hero", { titleTop: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Kata Italic</label>
              <input type="text" value={content.hero.titleAccent} onChange={(e) => patch("hero", { titleAccent: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Judul Baris 2</label>
              <input type="text" value={content.hero.titleBottom} onChange={(e) => patch("hero", { titleBottom: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Subjudul</label>
            <textarea rows={2} value={content.hero.subtitle} onChange={(e) => patch("hero", { subtitle: e.target.value })} className={inputClass} />
          </div>
        </>
      )}

      {renderSection(
        "routes",
        "Section Rute Populer",
        <>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Badge</label>
            <input type="text" value={content.routes.badge} onChange={(e) => patch("routes", { badge: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Judul</label>
            <input type="text" value={content.routes.title} onChange={(e) => patch("routes", { title: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Subjudul</label>
            <textarea rows={2} value={content.routes.subtitle} onChange={(e) => patch("routes", { subtitle: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Teks Tombol</label>
            <input type="text" value={content.routes.ctaText} onChange={(e) => patch("routes", { ctaText: e.target.value })} className={inputClass} />
          </div>
        </>
      )}

      {renderSection(
        "priorities",
        "Layanan Prioritas",
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Badge</label>
              <input type="text" value={content.priorities.badge} onChange={(e) => patch("priorities", { badge: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Judul</label>
              <input type="text" value={content.priorities.title} onChange={(e) => patch("priorities", { title: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {priorityItems.map((item: HomepagePriorityItem, index: number) => (
              <div key={index} className="flex gap-4 bg-surface-low p-4 rounded-2xl">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shrink-0 relative">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="ri-image-line text-foreground/20"></i>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const items = [...priorityItems];
                      items[index] = { ...items[index], title: e.target.value };
                      patch("priorities", { items });
                    }}
                    className={inputClass}
                    placeholder="Judul kartu"
                  />
                  <input type="text" value={item.image} onChange={(e) => {
                    const items = [...priorityItems];
                    items[index] = { ...items[index], image: e.target.value };
                    patch("priorities", { items });
                  }} className={inputClass} placeholder="URL gambar" />
                  <input
                    ref={(el) => {
                      fileRefs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPriorityImage(index, file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs.current[index]?.click()}
                    disabled={uploadingIndex === index}
                    className="px-4 py-2 rounded-lg bg-navy-deep text-white text-[10px] font-bold uppercase tracking-widest hover:bg-navy-deep/90 transition-all disabled:opacity-50 w-fit"
                  >
                    {uploadingIndex === index ? "Mengunggah..." : "Upload Gambar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {renderSection(
        "tourHighlight",
        "Section Tour & Sewa (Homepage)",
        <>
          <p className="text-xs text-foreground/50">
            Section ini menggantikan blok armada di homepage. Isi kartu diambil otomatis dari katalog Tour & Sewa.
          </p>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Badge</label>
            <input type="text" value={content.tourHighlight.badge} onChange={(e) => patch("tourHighlight", { badge: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Judul</label>
            <input type="text" value={content.tourHighlight.title} onChange={(e) => patch("tourHighlight", { title: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Subjudul</label>
            <textarea rows={2} value={content.tourHighlight.subtitle} onChange={(e) => patch("tourHighlight", { subtitle: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Teks Tombol</label>
            <input type="text" value={content.tourHighlight.ctaText} onChange={(e) => patch("tourHighlight", { ctaText: e.target.value })} className={inputClass} />
          </div>
        </>
      )}

      {renderSection(
        "instagram",
        "Section Instagram",
        <>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Badge</label>
            <input type="text" value={content.instagram.badge} onChange={(e) => patch("instagram", { badge: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Judul</label>
            <input type="text" value={content.instagram.title} onChange={(e) => patch("instagram", { title: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>URL Embed Instagram</label>
            <input type="text" value={content.instagram.embedUrl} onChange={(e) => patch("instagram", { embedUrl: e.target.value })} className={inputClass} placeholder="https://www.instagram.com/akun/embed/" />
          </div>
        </>
      )}

      {renderSection(
        "testimonials",
        "Testimoni",
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Badge</label>
              <input type="text" value={content.testimonials.badge} onChange={(e) => patch("testimonials", { badge: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Judul</label>
              <input type="text" value={content.testimonials.title} onChange={(e) => patch("testimonials", { title: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Subjudul</label>
            <textarea rows={2} value={content.testimonials.subtitle} onChange={(e) => patch("testimonials", { subtitle: e.target.value })} className={inputClass} />
          </div>

          <div className="flex flex-col gap-4">
            {testimonialItems.map((item: HomepageTestimonialItem, index: number) => (
              <div key={index} className="bg-surface-low p-5 rounded-2xl flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const items = [...testimonialItems];
                      items[index] = { ...items[index], name: e.target.value };
                      patch("testimonials", { items });
                    }}
                    className={inputClass}
                    placeholder="Nama"
                  />
                  <input
                    type="text"
                    value={item.role}
                    onChange={(e) => {
                      const items = [...testimonialItems];
                      items[index] = { ...items[index], role: e.target.value };
                      patch("testimonials", { items });
                    }}
                    className={inputClass}
                    placeholder="Profesi / Peran"
                  />
                </div>
                <textarea
                  rows={2}
                  value={item.text}
                  onChange={(e) => {
                    const items = [...testimonialItems];
                    items[index] = { ...items[index], text: e.target.value };
                    patch("testimonials", { items });
                  }}
                  className={inputClass}
                  placeholder="Isi testimoni"
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = testimonialItems.filter((_, i) => i !== index);
                    patch("testimonials", { items });
                  }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all w-fit"
                >
                  Hapus Testimoni
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patch("testimonials", {
                  items: [...testimonialItems, { name: "", role: "", text: "" }],
                })
              }
              className="px-6 py-3 rounded-xl bg-surface-low text-navy-deep text-xs font-bold hover:bg-surface-medium transition-all w-fit"
            >
              + Tambah Testimoni
            </button>
          </div>
        </>
      )}
    </div>
  );
}
