"use server";

import { getAppUrl } from "@/lib/env";

export async function triggerCron() {
  try {
    const baseUrl = getAppUrl();
    const response = await fetch(`${baseUrl}/api/cron/process-bookings`, {
      method: "GET",
      cache: "no-store"
    });
    const result = await response.json();
    return result;
  } catch (error: any) {
    return { error: error.message };
  }
}
