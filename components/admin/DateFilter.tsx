"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DateFilter({ initialDate }: { initialDate: string }) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/admin/schedules?date=${newDate}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-navy-deep uppercase tracking-widest">Filter Tanggal</label>
      <input 
        type="date" 
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
        className="bg-white border border-outline-ghost rounded-xl px-4 py-3 text-sm font-bold text-navy-deep focus:ring-2 focus:ring-gold-warm outline-none shadow-sm"
      />
    </div>
  );
}
