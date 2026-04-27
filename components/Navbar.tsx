import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
      <div className="glass rounded-full px-8 py-4 flex items-center justify-between shadow-ambient">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-64 h-12 overflow-hidden">
            <Image 
              src="/images/logo eltravel.png" 
              alt="EL Travel Logo" 
              fill 
              className="object-contain scale-[1.8]"
              priority
            />
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/booking" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Pesan Tiket
          </Link>
          <Link href="/routes" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Rute
          </Link>
          <Link href="/fleet" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Armada
          </Link>
          <Link href="/about" className="text-sm font-medium text-navy-deep/80 hover:text-navy-deep transition-colors">
            Tentang Kami
          </Link>
        </div>

        <button 
          className="btn-primary px-6 py-2 rounded-full text-sm font-bold shadow-sm"
          suppressHydrationWarning
        >
          Cek Jadwal
        </button>
      </div>
    </nav>
  );
}
