"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

const GIMMICK_PERCENT_KEY = "gimmickMarkupPercent";
const GIMMICK_ENABLED_KEY = "gimmickMarkupEnabled";

const DEFAULT_PERCENT = 10;
const DEFAULT_ENABLED = true;
const PARTNERSHIP_LOGO_KEY = "partnershipLogoUrls";
const LEGACY_PARTNERSHIP_LOGO_KEY = "partnershipLogoUrl";

async function getSetting(key: string): Promise<string | null> {
  if (!prisma.appSetting) {
    throw new Error(
      "Prisma client belum mengenal model AppSetting. Restart dev server (hentikan lalu jalankan ulang npm run dev)."
    );
  }
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

async function setSetting(key: string, value: string) {
  if (!prisma.appSetting) {
    throw new Error(
      "Prisma client belum mengenal model AppSetting. Restart dev server (hentikan lalu jalankan ulang npm run dev)."
    );
  }
  return prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getGimmickMarkupSettings() {
  const [percentRaw, enabledRaw] = await Promise.all([
    getSetting(GIMMICK_PERCENT_KEY),
    getSetting(GIMMICK_ENABLED_KEY),
  ]);

  const percent = percentRaw != null ? Number(percentRaw) : DEFAULT_PERCENT;
  const enabled =
    enabledRaw != null ? enabledRaw === "true" : DEFAULT_ENABLED;

  return {
    percent: Number.isFinite(percent) ? percent : DEFAULT_PERCENT,
    enabled,
  };
}

export async function updateGimmickMarkupSettings(data: {
  percent: number;
  enabled: boolean;
}) {
  const percent = Math.max(0, Math.min(100, Math.round(data.percent)));

  await Promise.all([
    setSetting(GIMMICK_PERCENT_KEY, String(percent)),
    setSetting(GIMMICK_ENABLED_KEY, data.enabled ? "true" : "false"),
  ]);

  revalidatePath("/admin/settings");
  revalidatePath("/search");
  return { percent, enabled: data.enabled };
}

export async function getPartnershipLogos() {
  const raw = (await getSetting(PARTNERSHIP_LOGO_KEY)) || (await getSetting(LEGACY_PARTNERSHIP_LOGO_KEY));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((url): url is string => typeof url === "string" && url.length > 0);
  } catch {
    // Migrate the previous single-URL setting format in memory.
    if (raw.startsWith("http")) return [raw];
  }
  return [];
}

export async function updatePartnershipLogo(formData: FormData) {
  const files = formData.getAll("logos").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { success: false, error: "Pilih minimal satu file logo." };
  if (files.some((file) => !file.type.startsWith("image/"))) return { success: false, error: "Semua file harus berupa gambar." };
  if (files.some((file) => file.size > 2 * 1024 * 1024)) return { success: false, error: "Ukuran setiap logo maksimal 2 MB." };

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_EL_TRAVELIN_READ_WRITE_TOKEN;
  if (!token) return { success: false, error: "Vercel Blob belum dikonfigurasi di environment server." };

  try {
    const uploaded = await Promise.all(files.map(async (file, index) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const blob = await put(`partnership-logo-${Date.now()}-${index}.${extension}`, Buffer.from(await file.arrayBuffer()), { access: "public", token, contentType: file.type });
      return blob.url;
    }));
    const existing = await getPartnershipLogos();
    const urls = [...existing, ...uploaded];
    await setSetting(PARTNERSHIP_LOGO_KEY, JSON.stringify(urls));
    revalidatePath("/admin/partnership-logo");
    revalidatePath("/invoice", "layout");
    return { success: true, urls };
  } catch (error) {
    console.error("Gagal menyimpan logo partnership:", error);
    return { success: false, error: "Logo gagal disimpan. Silakan coba lagi." };
  }
}

export async function removePartnershipLogo(url: string) {
  const urls = (await getPartnershipLogos()).filter((item) => item !== url);
  await setSetting(PARTNERSHIP_LOGO_KEY, JSON.stringify(urls));
  revalidatePath("/admin/partnership-logo");
  revalidatePath("/invoice", "layout");
  return { success: true };
}
