import "server-only";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PICKUP_CONFIG,
  PICKUP_CONFIG_KEY,
  mergePickupConfig,
  type PickupConfig,
} from "./pickup";

export async function getPickupConfig(): Promise<PickupConfig> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: PICKUP_CONFIG_KEY } });
    if (!row) return DEFAULT_PICKUP_CONFIG;
    return mergePickupConfig(JSON.parse(row.value));
  } catch (error) {
    // Truncated JSON from when AppSetting.value was VARCHAR(191).
    console.error("[PICKUP] Gagal memuat konfigurasi jemput:", error);
    await prisma.appSetting.deleteMany({ where: { key: PICKUP_CONFIG_KEY } }).catch(() => {});
    return DEFAULT_PICKUP_CONFIG;
  }
}
