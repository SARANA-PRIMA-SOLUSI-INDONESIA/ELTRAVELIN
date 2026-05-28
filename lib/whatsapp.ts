import { getAppUrl } from "./env";

export async function sendWhatsAppMessage(to: string, message: string) {
  const apiKey = process.env.STARSENDER_API_KEY;

  if (!apiKey) {
    return { success: false, message: "API Key tidak terbaca." };
  }

  let formattedTo = to.replace(/[^0-9]/g, '');
  if (formattedTo.startsWith('0')) {
    formattedTo = '62' + formattedTo.slice(1);
  } else if (!formattedTo.startsWith('62')) {
    formattedTo = '62' + formattedTo;
  }

  try {
    const response = await fetch("https://api.starsender.online/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": apiKey
      },
      body: JSON.stringify({
        messageType: "text",
        to: formattedTo,
        body: message
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    throw error;
  }
}

export async function sendBookingSuccessMessage(booking: any) {
  const message = `*PEMESANAN BERHASIL!* 🎉

Halo ${booking.contactName}, pembayaran Anda telah kami terima. Berikut adalah detail tiket Anda:

🎫 *Kode Booking:* ${booking.bookingCode}
📍 *Rute:* ${booking.schedule.route.origin} → ${booking.schedule.route.destination}
⏰ *Keberangkatan:* ${new Date(booking.schedule.departureTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })}
💺 *Nomor Kursi:* ${booking.seats.map((s: any) => s.seatNumber).join(', ')}

Lihat E-Ticket lengkap Anda di sini:
${getAppUrl()}/confirmation?code=${booking.bookingCode}

Mohon hadir 30 menit sebelum keberangkatan. Terima kasih telah memilih ELTravel!`;

  return sendWhatsAppMessage(booking.contactPhone, message);
}
