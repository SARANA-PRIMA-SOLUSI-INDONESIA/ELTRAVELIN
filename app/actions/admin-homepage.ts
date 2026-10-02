"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";
import {
  DEFAULT_HOMEPAGE,
  HOMEPAGE_SECTIONS,
  mergeHomepageContent,
  type HomepageContent,
  type HomepageSectionKey,
} from "@/lib/homepage-defaults";

const HOMEPAGE_KEY_PREFIX = "homepage.";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Tidak memiliki akses. Silakan login ulang.");
  return session;
}

function isValidSection(section: string): section is HomepageSectionKey {
  return (HOMEPAGE_SECTIONS as readonly string[]).includes(section);
}

export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { startsWith: HOMEPAGE_KEY_PREFIX } },
    });

    const saved: Partial<Record<HomepageSectionKey, unknown>> = {};
    for (const row of rows) {
      const section = row.key.slice(HOMEPAGE_KEY_PREFIX.length);
      if (!isValidSection(section)) continue;
      try {
        saved[section] = JSON.parse(row.value);
      } catch {
        // Abaikan nilai yang korup — fallback ke default.
      }
    }

    return mergeHomepageContent(saved);
  } catch (error) {
    console.error("[HOMEPAGE] Gagal memuat konten homepage:", error);
    return DEFAULT_HOMEPAGE;
  }
}

export async function updateHomepageSection(
  section: HomepageSectionKey,
  data: Record<string, unknown>
) {
  await requireAdmin();
  if (!isValidSection(section)) throw new Error("Section homepage tidak dikenal.");
  if (!data || typeof data !== "object") throw new Error("Data section tidak valid.");

  const value = JSON.stringify(data);
  if (value.length > 200_000) throw new Error("Konten terlalu besar untuk disimpan.");

  await prisma.appSetting.upsert({
    where: { key: `${HOMEPAGE_KEY_PREFIX}${section}` },
    create: { key: `${HOMEPAGE_KEY_PREFIX}${section}`, value },
    update: { value },
  });

  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { success: true };
}

export async function resetHomepageSection(section: HomepageSectionKey) {
  await requireAdmin();
  if (!isValidSection(section)) throw new Error("Section homepage tidak dikenal.");

  await prisma.appSetting.deleteMany({ where: { key: `${HOMEPAGE_KEY_PREFIX}${section}` } });

  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { success: true };
}

export async function uploadHomepageImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "Pilih file gambar terlebih dahulu." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "File harus berupa gambar." };
  }
  if (file.size > 3 * 1024 * 1024) {
    return { success: false as const, error: "Ukuran gambar maksimal 3 MB." };
  }

  const token =
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_EL_TRAVELIN_READ_WRITE_TOKEN;
  if (!token) {
    return { success: false as const, error: "Vercel Blob belum dikonfigurasi di environment server." };
  }

  try {
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const blob = await put(`homepage/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`, Buffer.from(await file.arrayBuffer()), {
      access: "public",
      token,
      contentType: file.type,
    });
    return { success: true as const, url: blob.url };
  } catch (error) {
    console.error("[HOMEPAGE] Gagal upload gambar:", error);
    return { success: false as const, error: "Gambar gagal diunggah. Silakan coba lagi." };
  }
}
