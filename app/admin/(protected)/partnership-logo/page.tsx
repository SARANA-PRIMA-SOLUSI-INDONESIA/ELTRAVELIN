import { getPartnershipLogos } from "@/app/actions/admin-settings";
import PartnershipLogoForm from "@/components/admin/PartnershipLogoForm";

export const dynamic = "force-dynamic";

export default async function PartnershipLogoPage() {
  const logoUrls = await getPartnershipLogos();
  return <div className="flex flex-col gap-10"><div><h1 className="text-4xl font-display font-bold text-navy-deep">Logo Partnership</h1><p className="mt-2 text-foreground/60">Atur satu atau beberapa logo partner yang dicetak pada bagian bawah invoice customer.</p></div><PartnershipLogoForm initialUrls={logoUrls} /></div>;
}
