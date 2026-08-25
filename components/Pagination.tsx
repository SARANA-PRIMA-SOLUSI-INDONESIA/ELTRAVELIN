"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
  pageSizeOptions?: number[];
}

function getPageItems(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: number[] = [1];
  for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
    pages.push(p);
  }
  if (totalPages > 1) pages.push(totalPages);
  const unique = [...new Set(pages)].filter((p) => p >= 1 && p <= totalPages);

  const items: (number | "...")[] = [];
  for (let i = 0; i < unique.length; i++) {
    if (i > 0 && unique[i] - unique[i - 1] > 1) items.push("...");
    items.push(unique[i]);
  }
  return items;
}

export default function Pagination({ total, pageSize, currentPage, pageSizeOptions }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);
  const hasOptions = !!pageSizeOptions && pageSizeOptions.length > 0;

  if (!hasOptions && totalPages <= 1) return null;

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changePageSize = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", size.toString());
    params.set("page", "1");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
      {hasOptions && (
        <div className="flex items-center gap-2 mr-auto">
          <label className="text-sm text-foreground/60">
            Tampilkan
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="ml-2 rounded-xl border border-gray-200 bg-surface-low px-3 py-2 text-sm text-foreground"
            >
              {pageSizeOptions!.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            baris
          </label>
          <span className="text-sm text-foreground/60">Menampilkan {start}-{end} dari {total}</span>
        </div>
      )}

      {totalPages > 1 && (
        <>
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold-warm hover:text-gold-warm transition-all"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>

          {getPageItems(currentPage, totalPages).map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-1 text-foreground/40">...</span>
            ) : (
              <button
                key={item}
                onClick={() => changePage(item)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                  currentPage === item
                    ? "bg-navy-deep text-white shadow-lg"
                    : "border border-gray-200 hover:border-gold-warm hover:text-gold-warm"
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold-warm hover:text-gold-warm transition-all"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </>
      )}
    </div>
  );
}

