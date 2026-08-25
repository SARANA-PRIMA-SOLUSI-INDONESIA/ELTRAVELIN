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
    if (
      result &&
      typeof result === "object" &&
      ("success" in result && result.success === false ||
        "status" in result && result.status === false ||
        "error" in result && Boolean(result.error))
    ) {
      return { success: false, error: `StarSender menolak pesan: ${JSON.stringify(result)}` };
    }
    return { success: true, result };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengirim pesan WhatsApp.",
    };
  }
}
