"use server";

import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function testWA(formData: FormData) {
  console.log("testWA action triggered");
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;

  if (!phone || !message) {
    throw new Error("Nomor dan pesan harus diisi");
  }

  try {
    const result = await sendWhatsAppMessage(phone, message);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
