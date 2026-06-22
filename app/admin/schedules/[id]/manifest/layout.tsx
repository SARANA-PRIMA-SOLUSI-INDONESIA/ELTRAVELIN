import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManifestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
