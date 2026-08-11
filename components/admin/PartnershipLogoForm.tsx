"use client";

import { removePartnershipLogo, updatePartnershipLogo } from "@/app/actions/admin-settings";
import { showError, showSuccess, confirmAction } from "@/lib/swal";
import { useRef, useState } from "react";

export default function PartnershipLogoForm({ initialUrls }: { initialUrls: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState(initialUrls);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) return showError({ title: "Pilih Logo", text: "Pilih minimal satu file logo terlebih dahulu." });
    setLoading(true);
    try {
      const data = new FormData();
      files.forEach((file) => data.append("logos", file));
      const result = await updatePartnershipLogo(data);
      if (!result.success) return showError({ title: "Gagal", text: result.error });
      setUrls(result.urls || []);
      setPreviews([]);
      setFiles([]);
      await showSuccess({ title: "Berhasil", text: "Logo partnership berhasil disimpan." });
    } catch { await showError({ title: "Gagal", text: "Logo gagal disimpan." }); }
    finally { setLoading(false); }
  };

  const remove = async (url: string) => {
    if (!(await confirmAction({ title: "Hapus Logo", danger: true, text: "Hapus logo partnership ini dari invoice?" }))) return;
    try { await removePartnershipLogo(url); const next = urls.filter((item) => item !== url); setUrls(next); await showSuccess({ title: "Berhasil", text: "Logo dihapus dari invoice." }); }
    catch { await showError({ title: "Gagal", text: "Logo gagal dihapus." }); }
  };

  return <form onSubmit={save} className="max-w-3xl bg-white rounded-[2rem] border border-outline-ghost p-8 flex flex-col gap-8">
    <div><h2 className="text-xl font-display font-bold text-navy-deep">Logo Partnership Invoice</h2><p className="mt-2 text-sm text-foreground/60">Logo akan tampil di bagian bawah invoice. Kelola logo tersimpan dan upload baru secara terpisah.</p></div>

    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold uppercase tracking-widest text-navy-deep">Logo tersimpan</h3><p className="mt-1 text-xs text-foreground/50">{urls.length} logo tampil pada invoice</p></div></div>
      {urls.length > 0 ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{urls.map((url, index) => <div key={url} className="group relative flex min-h-32 items-center justify-center rounded-2xl border border-outline-ghost bg-surface-low p-5"><img src={url} alt={`Logo partnership ${index + 1}`} className="max-h-20 max-w-full object-contain" /><button type="button" onClick={() => remove(url)} aria-label={`Hapus logo partnership ${index + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-outline-ghost transition hover:bg-red-500 hover:text-white"><i className="ri-delete-bin-line" /></button></div>)}</div> : <div className="rounded-2xl border border-dashed border-outline-ghost bg-surface-low px-6 py-8 text-center text-sm text-foreground/50">Belum ada logo partnership tersimpan.</div>}
    </section>

    <section className="flex flex-col gap-4 border-t border-outline-ghost pt-7">
      <div><h3 className="text-sm font-bold uppercase tracking-widest text-navy-deep">Tambah logo</h3><p className="mt-1 text-xs text-foreground/50">Pilih satu atau beberapa file. Maksimal 2 MB per file.</p></div>
      <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-outline-ghost bg-surface-low px-6 text-center transition hover:border-gold-warm hover:bg-gold-warm/5"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-gold-warm shadow-sm"><i className="ri-upload-cloud-2-line" /></span><span className="text-sm font-bold text-navy-deep">Pilih file logo</span><span className="text-xs text-foreground/50">PNG, JPG, WebP, atau SVG</span></button>
      <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={chooseFile} className="hidden" />
      {previews.length > 0 && <div className="rounded-2xl bg-surface-low p-4"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-navy-deep">File siap diunggah ({files.length})</p><div className="flex flex-wrap gap-3">{previews.map((preview, index) => <div key={`${preview}-${index}`} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-outline-ghost"><img src={preview} alt={`File baru ${index + 1}`} className="h-10 w-14 object-contain" /><span className="max-w-32 truncate text-xs text-foreground/60">{files[index]?.name}</span></div>)}</div></div>}
      <div><button type="submit" disabled={loading || files.length === 0} className="btn-primary rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-50">{loading ? "Mengunggah..." : "Simpan Logo Baru"}</button></div>
    </section>
  </form>;
}
