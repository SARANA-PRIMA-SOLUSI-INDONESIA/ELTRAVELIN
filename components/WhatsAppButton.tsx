"use client";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/62811221286"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[120px] right-8 z-[9999] flex items-center justify-center w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group animate-fade-in"
    >
      <i className="ri-whatsapp-fill text-4xl"></i>
    </a>
  );
}
