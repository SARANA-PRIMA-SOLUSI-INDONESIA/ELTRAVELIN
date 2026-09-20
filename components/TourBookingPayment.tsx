"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTourPaymentMethod, uploadTourPaymentProof } from "@/app/actions/tour";
import { showError, showSuccess } from "@/lib/swal";
import { formatIDR } from "@/lib/tour";

interface TourBookingPaymentProps {
  bookingCode: string;
  paymentMethod?: string | null;
  totalPrice: number;
  hasProof: boolean;
}

const METHODS = [
  { value: "MOOTA", title: "Transfer Bank", desc: "Verifikasi otomatis via Moota (kode unik 3 digit)" },
  { value: "MANUAL", title: "Transfer Manual", desc: "Unggah bukti transfer untuk diverifikasi admin" },
  { value: "POOL", title: "Bayar di Pool", desc: "Bayar langsung di loket pool keberangkatan" },
] as const;

export default function TourBookingPayment({
  bookingCode,
  paymentMethod,
  totalPrice,
  hasProof,
}: TourBookingPaymentProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(paymentMethod || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveMethod = async (method: string) => {
    if (method === paymentMethod) return;
    setSaving(true);
    try {
      await updateTourPaymentMethod(bookingCode, method as "MOOTA" | "POOL" | "MANUAL");
      await showSuccess({ title: "Tersimpan", text: "Metode pembayaran diperbarui." });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("bookingCode", bookingCode);
      fd.append("file", file);
      const result = await uploadTourPaymentProof(fd);
      if (!result.success) throw new Error(result.error);
      await showSuccess({ title: "Berhasil", text: "Bukti transfer terkirim. Menunggu verifikasi admin." });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal Upload", text: (error as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-ambient border border-outline-ghost flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-display font-bold text-navy-deep">Pembayaran</h2>
        <p className="text-xs text-foreground/50 font-body">
          Total tagihan: <span className="font-bold text-navy-deep">{formatIDR(totalPrice)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {METHODS.map((method) => (
          <label
            key={method.value}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              selected === method.value
                ? "border-gold-warm bg-gold-warm/5"
                : "border-navy-deep/5 hover:border-navy-deep/10"
            }`}
          >
            <input
              type="radio"
              name="tourBookingPaymentMethod"
              value={method.value}
              checked={selected === method.value}
              onChange={() => {
                setSelected(method.value);
                saveMethod(method.value);
              }}
              disabled={saving}
              className="w-4 h-4 accent-gold-warm"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-navy-deep">{method.title}</span>
              <span className="text-[10px] text-foreground/50">{method.desc}</span>
            </div>
          </label>
        ))}
      </div>

      {selected === "MOOTA" && (
        <div className="flex flex-col gap-4 p-6 bg-gold-warm/5 rounded-3xl border border-gold-warm/20">
          <div className="flex flex-col gap-1 text-center">
            <span className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-[0.2em]">Transfer Tepat Sebesar</span>
            <span className="text-2xl font-display font-black text-navy-deep">{formatIDR(totalPrice)}</span>
            <p className="text-[10px] text-gold-warm font-bold uppercase tracking-widest bg-white/60 py-2 rounded-lg">
              Termasuk kode unik 3 digit terakhir
            </p>
          </div>
          <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-navy-deep/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy-deep/5 rounded-xl flex items-center justify-center font-black text-navy-deep text-xs italic">
                MANDIRI
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. Rekening</span>
                <span className="text-base font-black text-navy-deep tracking-wider">1320-0320-90640</span>
                <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest mt-1">
                  a.n ELTRAVEL INDONESIA MAJU
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-navy-deep/50 leading-relaxed">
            Pembayaran diverifikasi otomatis oleh sistem 5-10 menit setelah transfer berhasil.
          </p>
        </div>
      )}

      {selected === "POOL" && (
        <div className="flex flex-col gap-4 p-6 bg-red-500/5 rounded-3xl border border-red-500/20 text-sm">
          <p className="font-bold text-navy-deep">Petunjuk Pembayaran di Loket:</p>
          <ul className="list-decimal pl-4 flex flex-col gap-1 text-foreground/60 text-xs leading-relaxed">
            <li>Kunjungi loket resmi Pool EL Travel.</li>
            <li>Sebutkan <strong>Kode Booking {bookingCode}</strong> kepada petugas.</li>
            <li>Lakukan pembayaran sebesar nominal tagihan secara tunai atau debit.</li>
            <li>Setelah lunas, petugas akan memverifikasi dan status berubah menjadi LUNAS.</li>
          </ul>
        </div>
      )}

      {selected === "MANUAL" && (
        <div className="flex flex-col gap-4 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/20">
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-bold text-navy-deep">Transfer Manual + Verifikasi Admin</p>
            <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-navy-deep/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. Rekening</span>
                <span className="text-base font-black text-navy-deep tracking-wider">1320-0320-90640</span>
                <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest mt-1">
                  MANDIRI a.n ELTRAVEL INDONESIA MAJU
                </span>
              </div>
              <span className="text-sm font-bold text-navy-deep">{formatIDR(totalPrice)}</span>
            </div>
            <p className="text-xs text-foreground/50">
              Unggah bukti transfer di bawah ini. Admin akan memverifikasi maksimal 1x24 jam pada hari kerja.
            </p>
          </div>

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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3.5 rounded-xl bg-navy-deep text-white text-xs font-bold hover:bg-navy-deep/90 transition-all disabled:opacity-50"
            >
              {uploading ? "Mengunggah..." : hasProof ? "Ganti Bukti Transfer" : "Unggah Bukti Transfer"}
            </button>
            {hasProof && (
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                ✓ Bukti sudah terkirim
              </span>
            )}
          </div>
        </div>
      )}

      {!selected && (
        <p className="text-xs text-foreground/50 text-center">Pilih salah satu metode pembayaran di atas.</p>
      )}
    </div>
  );
}
