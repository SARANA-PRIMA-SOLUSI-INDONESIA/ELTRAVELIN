import { getAppUrl } from "./env";

// Titik Naik / Titik Turun diambil dari BookingSegment bila ada (fallback ke route).
function getOriginPoint(booking: any) {
  return booking.segment?.originStop?.name || booking.schedule?.route?.origin || "-";
}

function getDestPoint(booking: any) {
  return booking.segment?.destinationStop?.name || booking.schedule?.route?.destination || "-";
}

// Info layanan jemput (booking travel biasa) untuk notifikasi WhatsApp.
function getPickupLine(booking: any) {
  if (!booking?.pickupRequested) return "";
  const distance =
    booking.pickupDistanceKm != null
      ? ", \u00B1 " +
        Number(booking.pickupDistanceKm).toLocaleString("id-ID", { maximumFractionDigits: 1 }) +
        " km"
      : "";
  return (
    "\u{1F697} Jemput: " +
    (booking.pickupAddress || "-") +
    " (" +
    (booking.pickupZone || "-") +
    distance +
    ") - Rp " +
    (booking.pickupFee || 0).toLocaleString("id-ID") +
    "\n"
  );
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const apiKey = process.env.STARSENDER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("STARSENDER_API_KEY tidak terbaca di server.");
  }

  let formattedTo = to.replace(/[^0-9]/g, '');
  if (formattedTo.startsWith('0')) {
    formattedTo = '62' + formattedTo.slice(1);
  } else if (!formattedTo.startsWith('62')) {
    formattedTo = '62' + formattedTo;
  }
  if (!/^62\d{8,13}$/.test(formattedTo)) {
    throw new Error(`Nomor WhatsApp tidak valid setelah normalisasi: ${formattedTo}`);
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

    const responseText = await response.text();
    let result: unknown;
    try {
      result = responseText ? JSON.parse(responseText) : null;
    } catch {
      result = responseText;
    }

    if (!response.ok) {
      const error = new Error(`StarSender API error (${response.status}): ${JSON.stringify(result)}`);
      console.error(error.message);
      throw error;
    }

    if (
      result &&
      typeof result === "object" &&
      ("success" in result && result.success === false ||
        "status" in result && result.status === false ||
        "error" in result && Boolean(result.error))
    ) {
      const error = new Error(`StarSender menolak pesan: ${JSON.stringify(result)}`);
      console.error(error.message);
      throw error;
    }

    return result as { success: boolean; message: string };
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
    "\u{1F464} Penumpang: " + passengerList + "\n" +
    getPickupLine(booking) +
    "\n\u{1F4B0} Total: Rp " + (booking.totalPrice || 0).toLocaleString("id-ID") + "\n" +
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
    "\u{1F4BA} *Nomor Kursi:* " + seats + "\n" +
    getPickupLine(booking) + "\n" +
    "Lihat E-Ticket lengkap Anda di sini:\n" +
    getAppUrl() + "/confirmation?code=" + booking.bookingCode + "\n\n" +
    "Mohon hadir 30 menit sebelum keberangkatan. Terima kasih telah memilih ELTravel!";

  return sendWhatsAppMessage(booking.contactPhone, message);
}

// ─────────────────────────────────────────────────────────────
// Notifikasi Tour & Sewa
// ─────────────────────────────────────────────────────────────

function formatTourDate(date: Date | string, withTime = false) {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleString("id-ID", {
    dateStyle: "full",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Jakarta",
  });
}

export async function sendTourInquiryReceivedMessage(inquiry: any) {
  const message =
    "*PERMINTAAN PENAWARAN DITERIMA* \u{1F4CB}\n\n" +
    "Halo " + inquiry.customerName + ", permintaan Anda untuk *" + inquiry.service.name + "* sudah kami terima.\n\n" +
    "\u{1F194} *Kode Permintaan:* " + inquiry.inquiryCode + "\n" +
    "\u{1F4C5} *Tanggal:* " + formatTourDate(inquiry.startDate) + (inquiry.endDate ? " s/d " + formatTourDate(inquiry.endDate) : "") + "\n" +
    "\u{1F465} *Jumlah Peserta:* " + inquiry.paxCount + " orang\n" +
    "\u{1F699} *Jumlah Unit:* " + (inquiry.unitCount || 1) + " unit\n\n" +
    "Tim kami akan segera mengirimkan penawaran harga terbaik untuk Anda. Cek status kapan saja di:\n" +
    getAppUrl() + "/tour/status/" + inquiry.inquiryCode + "\n\n" +
    "Terima kasih telah memilih ELTravel! \u{1F64F}";

  return sendWhatsAppMessage(inquiry.customerPhone, message);
}

export async function sendAdminTourInquiryNotification(inquiry: any) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return;

  const message =
    "\u{1F514} *PERMINTAAN TOUR/SEWA BARU!*\n\n" +
    "Kode: *" + inquiry.inquiryCode + "*\n" +
    "Layanan: *" + inquiry.service.name + "*\n" +
    "Pemesan: *" + inquiry.customerName + "*\n" +
    "\u{1F4DE} " + (inquiry.customerPhone || "-") + "\n" +
    "\u{1F4E7} " + (inquiry.customerEmail || "-") + "\n\n" +
    "\u{1F4C5} " + formatTourDate(inquiry.startDate) + (inquiry.endDate ? " s/d " + formatTourDate(inquiry.endDate) : "") + "\n" +
    "\u{1F465} " + inquiry.paxCount + " orang\n" +
    "\u{1F699} " + (inquiry.unitCount || 1) + " unit\n" +
    (inquiry.pickupLocation ? "\u{1F4CD} " + inquiry.pickupLocation + "\n" : "") +
    (inquiry.notes ? "\u{1F4DD} " + inquiry.notes + "\n" : "") +
    "\nSegera buat penawaran di panel admin.";

  return sendWhatsAppMessage(adminPhone, message);
}

export async function sendTourQuoteMessage(inquiry: any, quote: any) {
  const discountLine =
    quote.discountAmount > 0
      ? "\u{1F39F}\uFE0F Diskon: -Rp " + quote.discountAmount.toLocaleString("id-ID") +
        (quote.discountReason ? " (" + quote.discountReason + ")" : "") + "\n"
      : "";

  const message =
    "*PENAWARAN HARGA TOUR/SEWA* \u{1F4E8}\n\n" +
    "Halo " + inquiry.customerName + ", berikut penawaran untuk *" + inquiry.service.name + "*:\n\n" +
    "\u{1F194} *No. Penawaran:* " + quote.quoteNumber + "\n" +
    "\u{1F4C5} *Tanggal:* " + formatTourDate(inquiry.startDate) + (inquiry.endDate ? " s/d " + formatTourDate(inquiry.endDate) : "") + "\n" +
    "\u{1F465} *Peserta:* " + inquiry.paxCount + " orang\n" +
    "\u{1F699} *Jumlah Unit:* " + (quote.unitCount || inquiry.unitCount || 1) + " unit\n" +
    "\u{1F4B0} *Subtotal:* Rp " + quote.subtotal.toLocaleString("id-ID") + "\n" +
    discountLine +
    "\u2705 *Total:* Rp " + quote.totalPrice.toLocaleString("id-ID") + "\n" +
    (quote.validUntil ? "\u23F3 Berlaku sampai: " + formatTourDate(quote.validUntil) + "\n" : "") +
    (quote.notes ? "\n\u{1F4DD} " + quote.notes + "\n" : "") +
    "\nTerima atau tolak penawaran di:\n" +
    getAppUrl() + "/tour/status/" + inquiry.inquiryCode + "\n\n" +
    "Terima kasih! \u{1F64F}";

  return sendWhatsAppMessage(inquiry.customerPhone, message);
}

export async function sendTourBookingPendingMessage(booking: any) {
  const methodLabel =
    booking.paymentMethod === "MOOTA"
      ? "Transfer Bank (Otomatis)"
      : booking.paymentMethod === "POOL"
        ? "Bayar di Pool / Loket"
        : "Transfer Manual (Verifikasi Admin)";

  const message =
    "\u{1F4E6} *BOOKING TOUR/SEWA DIBUAT* \u2705\n\n" +
    "Halo " + booking.customerName + ", pesanan Anda telah tercatat.\n\n" +
    "\u{1F3AB} *Kode Booking:* " + booking.bookingCode + "\n" +
    "\u{1F5FA}\uFE0F *Layanan:* " + booking.serviceName + "\n" +
    "\u{1F4C5} *Tanggal:* " + formatTourDate(booking.startDate) + (booking.endDate ? " s/d " + formatTourDate(booking.endDate) : "") + "\n" +
    "\u{1F465} *Peserta:* " + booking.paxCount + " orang\n" +
    "\u{1F699} *Jumlah Unit:* " + (booking.unitCount || 1) + " unit\n" +
    "\u{1F4B0} *Total:* Rp " + booking.totalPrice.toLocaleString("id-ID") + "\n" +
    "\u{1F4B3} *Metode:* " + methodLabel + "\n\n" +
    "Instruksi pembayaran selengkapnya:\n" +
    getAppUrl() + "/tour/booking/" + booking.bookingCode + "\n\n" +
    "Terima kasih telah memilih ELTravel! \u{1F64F}";

  return sendWhatsAppMessage(booking.customerPhone, message);
}

export async function sendTourBookingConfirmedMessage(booking: any) {
  const message =
    "*PEMBAYARAN TOUR/SEWA BERHASIL!* \u{1F389}\n\n" +
    "Halo " + booking.customerName + ", pembayaran Anda telah kami terima.\n\n" +
    "\u{1F3AB} *Kode Booking:* " + booking.bookingCode + "\n" +
    "\u{1F5FA}\uFE0F *Layanan:* " + booking.serviceName + "\n" +
    "\u{1F4C5} *Tanggal:* " + formatTourDate(booking.startDate) + (booking.endDate ? " s/d " + formatTourDate(booking.endDate) : "") + "\n" +
    "\u{1F465} *Peserta:* " + booking.paxCount + " orang\n" +
    "\u{1F699} *Jumlah Unit:* " + (booking.unitCount || 1) + " unit\n" +
    (booking.pickupLocation ? "\u{1F4CD} *Penjemputan:* " + booking.pickupLocation + "\n" : "") +
    "\u{1F4B0} *Total:* Rp " + booking.totalPrice.toLocaleString("id-ID") + "\n\n" +
    "Lihat detail booking Anda di:\n" +
    getAppUrl() + "/tour/booking/" + booking.bookingCode + "\n\n" +
    "Terima kasih telah memilih ELTravel! \u{1F64F}";

  return sendWhatsAppMessage(booking.customerPhone, message);
}

export async function sendAdminTourBookingNotification(booking: any) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return;

  const message =
    "\u{1F514} *BOOKING TOUR/SEWA MASUK!*\n\n" +
    "Kode: *" + booking.bookingCode + "*\n" +
    "Layanan: *" + booking.serviceName + "*\n" +
    "Pemesan: *" + booking.customerName + "*\n" +
    "\u{1F4DE} " + (booking.customerPhone || "-") + "\n" +
    "\u{1F4E7} " + (booking.customerEmail || "-") + "\n\n" +
    "\u{1F4C5} " + formatTourDate(booking.startDate) + (booking.endDate ? " s/d " + formatTourDate(booking.endDate) : "") + "\n" +
    "\u{1F465} " + booking.paxCount + " orang\n" +
    "\u{1F699} " + (booking.unitCount || 1) + " unit\n" +
    "\u{1F4B0} Total: Rp " + (booking.totalPrice || 0).toLocaleString("id-ID") + "\n" +
    "\u{1F4B3} Metode: " + (booking.paymentMethod || "-") + "\n" +
    "\u{1F4CC} Status: " + booking.status + "\n\n" +
    "Segera diperiksa di panel admin.";

  return sendWhatsAppMessage(adminPhone, message);
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
    getPickupLine(booking) +
    "\u{1F4B0} *Total:* Rp " + (booking.totalPrice || 0).toLocaleString("id-ID") + "\n" +
    "\u{1F4B3} *Metode:* " + methodLabel + "\n\n" +
    "\u26A0\uFE0F *Segera selesaikan pembayaran dalam " + deadline + "*, jika tidak pesanan akan otomatis dibatalkan.\n\n" +
    "Detail pesanan: " + getAppUrl() + "/confirmation?code=" + booking.bookingCode + "\n\n" +
    "Terima kasih telah memilih ELTravel! \u{1F64F}";

  return sendWhatsAppMessage(booking.contactPhone, message);
}
