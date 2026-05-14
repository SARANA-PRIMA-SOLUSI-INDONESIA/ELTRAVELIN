"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

export default function Pagination({ total, pageSize, currentPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold-warm hover:text-gold-warm transition-all"
      >
        <i className="ri-arrow-left-s-line"></i>
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        // Basic pagination logic to show current, first, last and dots can be added here if pages are too many
        // For now keep it simple as schedules are usually not THAT many
        return (
          <button
            key={page}
            onClick={() => changePage(page)}
            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
              currentPage === page
                ? "bg-navy-deep text-white shadow-lg"
                : "border border-gray-200 hover:border-gold-warm hover:text-gold-warm"
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold-warm hover:text-gold-warm transition-all"
      >
        <i className="ri-arrow-right-s-line"></i>
      </button>
    </div>
  );
}
