// Konten default homepage — dipakai sebagai fallback saat admin belum
// mengisi konten lewat panel /admin/homepage. Nilai awal disamakan dengan
// konten yang sebelumnya hardcoded di app/page.tsx.

export interface HomepageHero {
  badge: string;
  titleTop: string;
  titleAccent: string;
  titleBottom: string;
  subtitle: string;
}

export interface HomepageRoutesSection {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
}

export interface HomepagePriorityItem {
  title: string;
  image: string;
}

export interface HomepagePriorities {
  badge: string;
  title: string;
  items: HomepagePriorityItem[];
}

export interface HomepageTourHighlight {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
}

export interface HomepageInstagram {
  badge: string;
  title: string;
  embedUrl: string;
}

export interface HomepageTestimonialItem {
  name: string;
  role: string;
  text: string;
}

export interface HomepageTestimonials {
  badge: string;
  title: string;
  subtitle: string;
  items: HomepageTestimonialItem[];
}

export interface HomepageContent {
  hero: HomepageHero;
  routes: HomepageRoutesSection;
  priorities: HomepagePriorities;
  tourHighlight: HomepageTourHighlight;
  instagram: HomepageInstagram;
  testimonials: HomepageTestimonials;
}

export const HOMEPAGE_SECTIONS = [
  "hero",
  "routes",
  "priorities",
  "tourHighlight",
  "instagram",
  "testimonials",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTIONS)[number];

export const DEFAULT_HOMEPAGE: HomepageContent = {
  hero: {
    badge: "Premium Executive Transit",
    titleTop: "The Modern",
    titleAccent: "Concierge",
    titleBottom: "Experience",
    subtitle:
      "Nikmati pengalaman berkendara kelas eksekutif dengan armada modern dan layanan terbaik di setiap rute kami.",
  },
  routes: {
    badge: "Destinasi Terpopuler",
    title: "Pilih Rute Perjalanan Anda",
    subtitle:
      "Jelajahi berbagai pilihan rute terbaik dengan jadwal fleksibel yang dirancang untuk kenyamanan perjalanan Anda.",
    ctaText: "Lihat Semua Rute",
  },
  priorities: {
    badge: "Layanan Prioritas",
    title: "Kenyamanan di Setiap Detail",
    items: [
      { title: "Kursi Premium", image: "/kursi.png" },
      { title: "Seat Belt Safety", image: "/priority-3.png" },
      { title: "Titip Paket", image: "/priority-5.png" },
      { title: "Armada Listrik", image: "/priority-6.png" },
    ],
  },
  tourHighlight: {
    badge: "Tour & Sewa",
    title: "Jelajahi Perjalanan Sesuai Keinginan Anda",
    subtitle:
      "Pilih paket tour pilihan atau sewa armada harian. Harga fleksibel dan bisa dinegosiasikan sesuai kebutuhan rombongan Anda.",
    ctaText: "Lihat Semua Paket",
  },
  instagram: {
    badge: "Ikuti Kami",
    title: "Postingan Terakhir Kami",
    embedUrl: "https://www.instagram.com/eltravel_in/embed/",
  },
  testimonials: {
    badge: "Testimoni",
    title: "Suara dari Eksklusivitas Kami",
    subtitle:
      "Bergabunglah dengan ribuan pelanggan yang telah merasakan standar baru perjalanan darat premium.",
    items: [
      {
        name: "Budi Santoso",
        role: "Pengusaha",
        text: "Pelayanan luar biasa. Sopirnya ramah dan armada Hiace-nya sangat bersih. Perjalanan Jakarta-Bandung terasa sangat singkat karena nyaman.",
      },
      {
        name: "Sari Wijaya",
        role: "Digital Nomad",
        text: "Paling suka dengan layanan door-to-doornya. Sangat memudahkan buat saya yang sering bepergian dengan banyak koper. Highly recommended!",
      },
      {
        name: "Andra Pratama",
        role: "UI Designer",
        text: "WiFi-nya kencang, bisa tetap meeting di jalan. Kursinya juga bisa direbahkan maksimal jadi bisa istirahat dengan tenang.",
      },
    ],
  },
};

/** Gabungkan default dengan konten tersimpan dari AppSetting (partial). */
export function mergeHomepageContent(
  saved: Partial<Record<HomepageSectionKey, unknown>>
): HomepageContent {
  const result: HomepageContent = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE));
  for (const key of HOMEPAGE_SECTIONS) {
    const value = saved[key];
    if (value && typeof value === "object") {
      result[key] = { ...result[key], ...(value as object) } as never;
      if (Array.isArray((value as { items?: unknown[] }).items)) {
        (result[key] as { items: unknown[] }).items = (value as { items: unknown[] }).items;
      }
    }
  }
  return result;
}
