"use server";

export async function triggerCron() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
