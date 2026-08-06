"use client";

import { useState } from "react";
import ManualBookingModal from "@/components/admin/ManualBookingModal";

export default function CreateManualButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gold-warm text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gold-warm/90 transition-all flex items-center gap-2 shadow-sm"
      >
        <i className="ri-add-line"></i>
        Buat Manual
      </button>
      {open && <ManualBookingModal onClose={() => setOpen(false)} />}
    </>
  );
}
