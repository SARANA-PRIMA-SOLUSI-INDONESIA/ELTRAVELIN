"use client";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/62811221286"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[120px] right-8 z-[9999] flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group animate-fade-in"
    >
      <i className="ri-whatsapp-line text-2xl"></i>
      <span className="text-sm font-bold tracking-tight">Chat Kami</span>
    </a>
  );
}
