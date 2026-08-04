"use server";

import { getAppUrl } from "@/lib/env";

export async function triggerCron() {
  try {
    const baseUrl = getAppUrl();
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return { error: "CRON_SECRET not configured" };
    }

    const response = await fetch(`${baseUrl}/api/cron/process-bookings`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
      },
    });
    const result = await response.json();
    return result;
  } catch (error: any) {
    return { error: error.message };
  }
}
