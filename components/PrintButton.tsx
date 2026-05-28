"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-navy-deep text-white px-4 py-2 rounded-lg hover:bg-navy-deep/90 transition-colors"
    >
      <i className="ri-printer-line"></i>
      <span className="font-medium">Cetak Invoice</span>
    </button>
  );
}
