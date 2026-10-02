import { getHomepageContent } from "@/app/actions/admin-homepage";
import HomepageForm from "@/components/admin/HomepageForm";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const content = await getHomepageContent();

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-bold text-navy-deep">Homepage</h1>
        <p className="text-foreground/60">
          Atur teks, gambar, dan testimoni yang tampil di halaman utama. Section Tour & Sewa
          otomatis mengambil data dari katalog.
        </p>
      </div>

      <HomepageForm initial={content} />
    </div>
  );
}
