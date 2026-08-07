"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const GIMMICK_PERCENT_KEY = "gimmickMarkupPercent";
const GIMMICK_ENABLED_KEY = "gimmickMarkupEnabled";

const DEFAULT_PERCENT = 10;
const DEFAULT_ENABLED = true;

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
