import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-background py-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="relative w-56 h-10 overflow-hidden">
              <Image 
                src="/images/logo eltravel.png" 
                alt="EL Travel Logo" 
                fill 
                className="object-contain object-left scale-[1.8]"
              />
            </div>
          </Link>
          <p className="text-sm leading-relaxed text-foreground/60 mb-6 font-body">
            Penyedia layanan transportasi executive terpercaya dengan jaringan rute terluas di Indonesia. Nikmati pengalaman berkendara kelas concierge dengan armada modern kami.
          </p>
          <p className="text-xs text-foreground/40 font-body transition-colors hover:text-foreground/60">
            © 2024 EL Travel. The Modern Concierge Experience.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <h4 className="font-display font-bold text-navy-deep text-sm uppercase tracking-wider mb-2">Layanan</h4>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Booking Tiket</Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Sewa Bus</Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Pengiriman Paket</Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">EL Travel Executive</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-display font-bold text-navy-deep text-sm uppercase tracking-wider mb-2">Perusahaan</h4>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Tentang Kami</Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Karir</Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Blog</Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-navy-deep transition-colors">Kerjasama</Link>
          </div>

          <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
            <h4 className="font-display font-bold text-navy-deep text-sm uppercase tracking-wider mb-2">Hubungi Kami</h4>
            <p className="text-sm text-foreground/60">Jakarta, Indonesia</p>
            <p className="text-sm text-foreground/60">(021) 1234-5678</p>
            <p className="text-sm text-foreground/60">hello@eltravel.id</p>
            <div className="flex gap-4 mt-2">
              <div className="w-8 h-8 rounded-full bg-surface-low border border-outline-ghost hover:border-navy-deep transition-colors flex items-center justify-center cursor-pointer">
                <i className="ri-instagram-line text-navy-deep"></i>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-low border border-outline-ghost hover:border-navy-deep transition-colors flex items-center justify-center cursor-pointer">
                <i className="ri-twitter-line text-navy-deep"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 flex flex-wrap gap-x-8 gap-y-4 text-xs text-foreground/40 font-body">
        <Link href="#" className="hover:text-foreground/60">Syarat & Ketentuan</Link>
        <Link href="#" className="hover:text-foreground/60">Kebijakan Privasi</Link>
        <Link href="#" className="hover:text-foreground/60">Bantuan</Link>
        <Link href="#" className="hover:text-foreground/60">Kontak</Link>
      </div>
    </footer>
  );
}
