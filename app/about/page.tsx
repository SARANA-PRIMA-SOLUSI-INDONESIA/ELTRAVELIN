import Image from "next/image";
import Link from "next/link";

// const team = [
//   { name: "Cristy Situmorang", role: "Komisaris", image: "/team-1.jpg" },
//   { name: "Chandra Limbong", role: "Founder & Director", image: "/team-2.jpg" },
//   { name: "Martinus Sitompul", role: "Komisaris", image: "/team-3.jpg" },
// ];

export const metadata = {
  title: "Tentang Kami | EL Travel",
  description:
    "Kenali EL Travel — kantor, kontak, dan tim di balik layanan perjalanan premium. Kantor: Jl. A. Yani No.835A, Bandung.",
};

export default function About() {
  return (
    <div className="flex flex-col gap-24 pb-32">
      <section className="relative min-h-[500px] flex items-center overflow-hidden bg-navy-deep rounded-b-[4rem]">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src="/hero-luxury.png"
            alt="About Us Background"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>

        <div className="max-w-7xl mx-auto w-full z-10 relative flex flex-col items-center text-center gap-6 px-6">
          <span className="text-xs font-bold text-gold-warm uppercase tracking-widest animate-fade-in">Mengenal EL Travel</span>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight animate-fade-in">
            Definisi Baru <br /> <span className="italic font-light">Perjalanan Premium</span>
          </h1>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
          <div className="w-full lg:w-1/2 flex flex-col gap-8">
            <h2 className="text-4xl font-display font-bold text-navy-deep leading-tight">Visi Layanan <br /> yang Mengutamakan Jiwa</h2>
            <p className="text-lg text-foreground/80 leading-relaxed font-body">
              EL Travel lahir dari keinginan untuk mengubah cara kita memandang perjalanan antar kota. Kami tidak hanya memindahkan Anda dari satu tempat ke tempat lain—kami memberikan pengalaman yang memanjakan setiap indra Anda.
            </p>
            <p className="text-foreground/60 leading-relaxed font-body">
              Dengan konsep &quot;The Modern Concierge,&quot; setiap penumpang diperlakukan layaknya tamu istimewa di hotel berbintang. Dari kemudahan pemesanan hingga layanan penjemputan tepat waktu, kami memastikan ketenangan pikiran Anda sepanjang perjalanan.
            </p>
          </div>
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4 p-8 tonal-section rounded-[2.5rem]">
              <h3 className="text-3xl font-display font-bold text-navy-deep italic">01.</h3>
              <h4 className="text-lg font-bold text-navy-deep uppercase tracking-widest leading-none">Punctuality</h4>
              <p className="text-xs text-foreground/60">Komitmen tepat waktu adalah prioritas mutlak kami.</p>
            </div>
            <div className="flex flex-col gap-4 p-8 tonal-section rounded-[2.5rem] mt-8 lg:-mt-8">
              <h3 className="text-3xl font-display font-bold text-navy-deep italic">02.</h3>
              <h4 className="text-lg font-bold text-navy-deep uppercase tracking-widest leading-none">Privacy</h4>
              <p className="text-xs text-foreground/60">Kabin senyap dan eksklusif untuk ketenangan Anda.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="kantor" className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest">Kantor & Kontak</span>
            <h2 className="text-4xl font-display font-bold text-navy-deep leading-tight">Kunjungi Kami</h2>
            <p className="text-foreground/60 font-body">
              Butuh bertemu langsung atau konfirmasi lokasi pool? Berikut alamat kantor resmi EL Travel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3 p-8 tonal-section rounded-[2rem]">
              <i className="ri-map-pin-2-line text-2xl text-gold-warm"></i>
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-widest">Alamat Kantor</h3>
              <p className="text-sm text-foreground/70 leading-relaxed font-body">
                PT Eltravel Indonesia Maju
                <br />
                Jl. A. Yani No.835A, Padasuka
                <br />
                Kec. Cibeunying Kidul
                <br />
                Kota Bandung, Jawa Barat 40125
              </p>
              <a
                href="https://maps.app.goo.gl/xjQKsFZULzoPD2qM9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-gold-warm hover:underline mt-1"
              >
                Buka di Google Maps →
              </a>
            </div>

            <div className="flex flex-col gap-3 p-8 tonal-section rounded-[2rem]">
              <i className="ri-whatsapp-line text-2xl text-gold-warm"></i>
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-widest">Telepon / WhatsApp</h3>
              <p className="text-sm text-foreground/70 leading-relaxed font-body">
                Concierge siap membantu pemesanan, konfirmasi, dan pertanyaan perjalanan.
              </p>
              <a
                href="https://wa.me/62811221286"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-navy-deep hover:text-gold-warm transition-colors"
              >
                0811-221-286
              </a>
            </div>

            <div className="flex flex-col gap-3 p-8 tonal-section rounded-[2rem]">
              <i className="ri-mail-line text-2xl text-gold-warm"></i>
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-widest">Email</h3>
              <p className="text-sm text-foreground/70 leading-relaxed font-body">
                Untuk kerja sama, pertanyaan resmi, atau dokumen pendukung.
              </p>
              <a href="mailto:admin@eltravel.in" className="text-base font-bold text-navy-deep hover:text-gold-warm transition-colors">
                admin@eltravel.in
              </a>
              <Link href="/" className="text-xs font-bold text-gold-warm hover:underline mt-auto pt-2">
                Pesan tiket sekarang →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tim Pendiri & Komisaris — disembunyikan sementara
      <section className="px-6 md:px-12 lg:px-24 bg-surface-low py-32 rounded-[4rem] mx-6 md:mx-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-20">
          <div className="text-center flex flex-col gap-4 max-w-2xl">
            <h2 className="text-4xl font-display font-bold text-navy-deep italic lowercase underline-offset-8 underline decoration-gold-warm decoration-2 ">Tim Pendiri & Komisaris</h2>
            <p className="text-foreground/60 font-body">Di balik EL Travel berdiri jajaran Komisaris, Founder & Director, serta Komisaris yang memegang visi dan arah perusahaan untuk menghadirkan layanan perjalanan premium yang aman dan nyaman bagi Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
            {team.map((member, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-6">
                <div className="relative w-full rounded-[2.5rem] bg-navy-deep/5 overflow-hidden transition-all duration-500">
                  <div className="absolute inset-0 bg-navy-deep/10 flex items-center justify-center font-bold text-foreground/10 text-4xl">Tim EL</div>
                  <Image src={member.image} alt={member.name} width={400} height={533} className="relative w-full h-auto" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display font-bold text-navy-deep text-lg capitalize">{member.name}</span>
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}
    </div>
  );
}
