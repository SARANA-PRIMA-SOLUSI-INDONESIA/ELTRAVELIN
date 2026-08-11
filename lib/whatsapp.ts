import { getAppUrl } from "./env";

// Titik Naik / Titik Turun diambil dari BookingSegment bila ada (fallback ke route).
function getOriginPoint(booking: any) {
  return booking.segment?.originStop?.name || booking.schedule?.route?.origin || "-";
}

function getDestPoint(booking: any) {
  return booking.segment?.destinationStop?.name || booking.schedule?.route?.destination || "-";
}

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

export async function sendAdminWhatsAppNotification(booking: any) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return;

  const rute = getOriginPoint(booking) + " \u2192 " + getDestPoint(booking);
  const departure = booking.schedule?.departureTime
    ? new Date(booking.schedule.departureTime).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Jakarta" })
    : "-";
  const seatList = (booking.seats || []).map(function (s: any) { return s.seatNumber; }).join(", ") || "-";
  const passengerList = (booking.passengers || []).map(function (p: any) { return p.name; }).join(", ") || "-";

  const message =
    "\u{1F514} *BOOKING BARU MASUK!*\n\n" +
    "Kode: *" + booking.bookingCode + "*\n" +
    "Pemesan: *" + booking.contactName + "*\n" +
    "\u{1F4DE} " + (booking.contactPhone || "-") + "\n" +
    "\u{1F4E7} " + (booking.contactEmail || "-") + "\n\n" +
    "\u{1F4CD} Rute: " + rute + "\n" +
    "\u23F0 Berangkat: " + departure + "\n" +
    "\u{1F4BA} Kursi: " + seatList + "\n" +
    "\u{1F464} Penumpang: " + passengerList + "\n\n" +
    "\u{1F4B0} Total: Rp " + (booking.totalPrice || 0).toLocaleString("id-ID") + "\n" +
    "\u{1F4B3} Metode: " + (booking.paymentMethod || "-") + "\n" +
    "\u{1F4CC} Status: " + booking.status + "\n\n" +
    "Segera diperiksa di panel admin.";

  return sendWhatsAppMessage(adminPhone, message);
}

export async function sendBookingSuccessMessage(booking: any) {
  const rute = getOriginPoint(booking) + " \u2192 " + getDestPoint(booking);
  const departure = new Date(booking.schedule.departureTime).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
  const seats = booking.seats.map(function (s: any) { return s.seatNumber; }).join(", ");

  const message =
    "*PEMESANAN BERHASIL!* \u{1F389}\n\n" +
    "Halo " + booking.contactName + ", pembayaran Anda telah kami terima. Berikut adalah detail tiket Anda:\n\n" +
    "\u{1F3AB} *Kode Booking:* " + booking.bookingCode + "\n" +
    "\u{1F4CD} *Rute:* " + rute + "\n" +
    "\u23F0 *Keberangkatan:* " + departure + "\n" +
    "\u{1F4BA} *Nomor Kursi:* " + seats + "\n\n" +
    "Lihat E-Ticket lengkap Anda di sini:\n" +
    getAppUrl() + "/confirmation?code=" + booking.bookingCode + "\n\n" +
    "Mohon hadir 30 menit sebelum keberangkatan. Terima kasih telah memilih ELTravel!";

  return sendWhatsAppMessage(booking.contactPhone, message);
}

export async function sendBookingPendingReminder(booking: any) {
  const rute = getOriginPoint(booking) + " \u2192 " + getDestPoint(booking);
  const departure = booking.schedule?.departureTime
    ? new Date(booking.schedule.departureTime).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Jakarta" })
    : "-";
  const methodLabel = booking.paymentMethod === "POOL" ? "Bayar di Pool" : booking.paymentMethod === "MOOTA" ? "Transfer Bank" : "Transfer/Pool";
  const deadline = booking.paymentMethod === "POOL" ? "60 menit" : "35 menit";
  const seats = (booking.seats || []).map(function (s: any) { return s.seatNumber; }).join(", ");

  const message =
    "\u{1F4E6} *BOOKING BERHASIL!* \u2705\n\n" +
    "Halo " + booking.contactName + ", pesanan Anda telah tercatat.\n\n" +
    "\u{1F3AB} *Kode Booking:* " + booking.bookingCode + "\n" +
    "\u{1F4CD} *Rute:* " + rute + "\n" +
    "\u23F0 *Keberangkatan:* " + departure + "\n" +
    "\u{1F4BA} *Kursi:* " + seats + "\n" +
    "\u{1F4B0} *Total:* Rp " + (booking.totalPrice || 0).toLocaleString("id-ID") + "\n" +
    "\u{1F4B3} *Metode:* " + methodLabel + "\n\n" +
    "\u26A0\uFE0F *Segera selesaikan pembayaran dalam " + deadline + "*, jika tidak pesanan akan otomatis dibatalkan.\n\n" +
    "Detail pesanan: " + getAppUrl() + "/confirmation?code=" + booking.bookingCode + "\n\n" +
    "Terima kasih telah memilih ELTravel! \u{1F64F}";

  return sendWhatsAppMessage(booking.contactPhone, message);
}
