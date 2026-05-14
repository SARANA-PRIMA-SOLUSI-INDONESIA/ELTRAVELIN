"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminBookingFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");

  const handleFilter = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (search) params.set("q", search);
    else params.delete("q");
    
    if (status !== "ALL") params.set("status", status);
    else params.delete("status");
    
    params.set("page", "1"); // Reset to page 1
    
    router.push(`/admin/bookings?${params.toString()}`);
  };

  return (
    <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-outline-ghost">
      <div className="flex-grow relative">
        <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"></i>
        <input 
          type="text"
          placeholder="Cari Kode Booking atau Nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface-low rounded-2xl text-sm border-none focus:ring-2 focus:ring-navy-deep transition-all"
        />
      </div>
      
      <div className="flex gap-4">
        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-surface-low rounded-2xl px-6 py-3 text-sm font-bold text-navy-deep border-none focus:ring-2 focus:ring-navy-deep cursor-pointer transition-all"
        >
          <option value="ALL">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button 
          type="submit"
          className="bg-navy-deep text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-navy-deep/90 transition-all shadow-sm"
        >
          Filter
        </button>
      </div>
    </form>
  );
}
