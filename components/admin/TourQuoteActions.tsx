"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTourQuote, sendTourQuote } from "@/app/actions/admin-tour";
import { confirmAction, showError, showSuccess } from "@/lib/swal";

interface TourQuoteActionsProps {
  quoteId: string;
  status: string;
  hasBooking: boolean;
}

export default function TourQuoteActions({ quoteId, status, hasBooking }: TourQuoteActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await sendTourQuote(quoteId);
      await showSuccess({ title: "Terkirim", text: "Penawaran dikirim ke customer." });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!(await confirmAction({ title: "Hapus Penawaran", danger: true, text: "Hapus penawaran ini?" }))) return;
    setLoading(true);
    try {
      await deleteTourQuote(quoteId);
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === "DRAFT" && !hasBooking && (
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-navy-deep text-white text-[10px] font-bold uppercase tracking-widest hover:bg-navy-deep/90 transition-all disabled:opacity-50"
        >
          Kirim
        </button>
      )}
      {!hasBooking && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
        >
          <i className="ri-delete-bin-line"></i>
        </button>
      )}
    </div>
  );
}
