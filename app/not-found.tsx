import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-warm">EL Travel</p>
        <p className="mt-8 text-8xl font-display font-bold text-navy-deep">404</p>
        <h1 className="mt-4 text-3xl font-display font-bold text-navy-deep">Halaman tidak ditemukan</h1>
        <p className="mt-4 text-foreground/60 leading-7">
          Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau alamatnya tidak sesuai.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex rounded-xl px-6 py-3 font-bold text-sm">
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
}
