"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rejectTourInquiry } from "@/app/actions/admin-tour";
import { confirmAction, showError, showSuccess } from "@/lib/swal";

export default function TourInquiryRejectButton({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    const confirmed = await confirmAction({
      title: "Tolak Permintaan",
      danger: true,
      text: "Tandai permintaan ini sebagai ditolak?",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await rejectTourInquiry(inquiryId);
      await showSuccess({ title: "Ditolak", text: "Permintaan ditandai sebagai ditolak." });
      router.refresh();
    } catch (error) {
      await showError({ title: "Gagal", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleReject}
      disabled={loading}
      className="px-6 py-3 rounded-xl bg-red-50 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
    >
      {loading ? "Memproses..." : "Tolak Permintaan"}
    </button>
  );
}
