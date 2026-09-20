import { getAppUrl } from "./env";

const RESEND_API_KEY = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@eltravel.in';
const RESEND_URL = 'https://api.resend.com/emails';

// Titik Naik / Titik Turun diambil dari BookingSegment bila ada (fallback ke route).
function getOriginPoint(booking: any) {
  return booking.segment?.originStop?.name || booking.schedule?.route?.origin || '?';
}

function getDestPoint(booking: any) {
  return booking.segment?.destinationStop?.name || booking.schedule?.route?.destination || '?';
}

async function sendMail(to: string, subject: string, html: string) {
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SMTP_FROM.startsWith('"') || SMTP_FROM.includes('<')
          ? SMTP_FROM
          : `EL Travel <${SMTP_FROM}>`,
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(`Resend API error (${res.status}): ${JSON.stringify(data)}`);
      console.error(error.message);
      throw error;
    }

    console.log(`Email sent to ${to}, id: ${data.id}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendETicket(booking: any) {
  if (!booking.contactEmail) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #1C1C1E;">E-Ticket EL Travel</h2>
      <p>Halo <strong>${booking.contactName}</strong>,</p>
      <p>Pembayaran Anda telah berhasil dikonfirmasi. Berikut adalah detail tiket Anda:</p>
      
      <div style="background: #F8F9FA; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Kode Booking:</strong> ${booking.bookingCode}</p>
        <p><strong>Rute:</strong> ${getOriginPoint(booking)} → ${getDestPoint(booking)}</p>
        <p><strong>Waktu Keberangkatan:</strong> ${new Date(booking.schedule.departureTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })}</p>
        <p><strong>Kursi:</strong> ${booking.seats.map((s: any) => s.seatNumber).join(', ')}</p>
        ${booking.pickupRequested ? `<p><strong>Jemput (${booking.pickupCity || '-'}):</strong> ${booking.pickupAddress || '-'} (${booking.pickupZone || '-'}${booking.pickupDistanceKm != null ? `, &plusmn; ${Number(booking.pickupDistanceKm).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km` : ''}) &middot; Rp ${(booking.pickupFee || 0).toLocaleString('id-ID')}</p>` : ''}
        <p><strong>Total Bayar:</strong> Rp ${booking.totalPrice.toLocaleString('id-ID')}</p>
      </div>

      <p>Silakan tunjukkan e-ticket ini kepada petugas kami saat keberangkatan.</p>
      <p>Terima kasih telah memilih EL Travel!</p>
    </div>
  `;

  await sendMail(booking.contactEmail, `E-Ticket Booking ${booking.bookingCode} - EL Travel`, html);
}

export async function sendAdminNotification(booking: any) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const fmt = (d: Date) => {
    const date = d.toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' });
    const time = d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    return `${date}<br>Pukul ${time} WIB`;
  };
  const bookingDate = fmt(new Date(booking.createdAt || booking.settlementTime || new Date()));
  const departureDate = booking.schedule?.departureTime
    ? fmt(new Date(booking.schedule.departureTime))
    : '-';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #1C1C1E; padding: 20px 24px;">
        <table style="width: 100%;">
          <tr>
            <td>
              <span style="color: #D4AF37; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Booking Baru Masuk</span>
            </td>
            <td style="text-align: right;">
              <span style="display: inline-block; background: #2E7D32; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">${booking.status}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px;">
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #374151; line-height: 1.6;">
          Booking baru telah <strong>dikonfirmasi</strong> dengan detail sebagai berikut:
        </p>

        <div style="background: #F8F9FA; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Kode Booking</td>
              <td style="padding: 8px 0 8px 16px; vertical-align: top; font-size: 13px; font-weight: 700; color: #111827; word-break: break-word;">${booking.bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Nama Pemesan</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${booking.contactName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Email</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${booking.contactEmail || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Telepon</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${booking.contactPhone || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Rute</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${getOriginPoint(booking)} &rarr; ${getDestPoint(booking)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Keberangkatan</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${departureDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Kursi</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${(booking.seats || []).map((s: any) => s.seatNumber).join(', ') || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Penumpang</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${(booking.passengers || []).map((p: any) => p.name).join(', ') || '-'}</td>
            </tr>
            ${booking.pickupRequested ? `
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Layanan Jemput</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${booking.pickupCity || '-'} &middot; ${booking.pickupZone || '-'}${booking.pickupDistanceKm != null ? ` (&plusmn; ${Number(booking.pickupDistanceKm).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km)` : ''}<br>${booking.pickupAddress || '-'}${booking.pickupNote ? `<br>Catatan: ${booking.pickupNote}` : ''}<br>Biaya: Rp ${(booking.pickupFee || 0).toLocaleString('id-ID')}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Waktu Booking</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Metode Bayar</td>
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${booking.paymentMethod || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 0 0; border-top: 2px solid #d1d5db; vertical-align: top; width: 130px; color: #6b7280; font-size: 13px; font-weight: 600;">Total Bayar</td>
              <td style="padding: 10px 0 0 16px; border-top: 2px solid #d1d5db; vertical-align: top; font-size: 15px; font-weight: 700; color: #D4AF37; word-break: break-word;">Rp ${(booking.totalPrice || 0).toLocaleString('id-ID')}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 20px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">
          Notifikasi otomatis dari sistem EL Travel &middot; Mohon tidak membalas email ini.
        </p>
      </div>
    </div>
  `;

  await sendMail(adminEmail, `[BOOKING BARU] ${booking.bookingCode} - ${booking.contactName}`, html);
}

export async function sendPaymentReminder(booking: any) {
  if (!booking.contactEmail) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #1C1C1E;">Selesaikan Pembayaran Anda</h2>
      <p>Halo <strong>${booking.contactName}</strong>,</p>
      <p>Kami melihat Anda memiliki booking yang belum dibayar dengan kode: <strong>${booking.bookingCode}</strong>.</p>
      
      <p style="color: #D32F2F; font-weight: bold;">Mohon segera lakukan pembayaran dalam 15 menit ke depan atau booking Anda akan otomatis dibatalkan oleh sistem.</p>
      
      <p>Abaikan email ini jika Anda sudah melakukan pembayaran.</p>
      <p>Terima kasih,</p>
      <p>EL Travel Team</p>
    </div>
  `;

  await sendMail(booking.contactEmail, `Reminder Pembayaran Booking ${booking.bookingCode}`, html);
}

// ─────────────────────────────────────────────────────────────
// Email Tour & Sewa
// ─────────────────────────────────────────────────────────────

function formatTourDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function tourRows(rows: Array<[string, string]>) {
  return rows
    .map(
      ([label, value], index) => `
      <tr>
        <td style="padding: 8px 0; ${index > 0 ? "border-top: 1px solid #e5e7eb;" : ""} vertical-align: top; width: 150px; color: #6b7280; font-size: 13px; font-weight: 600;">${label}</td>
        <td style="padding: 8px 0 8px 16px; ${index > 0 ? "border-top: 1px solid #e5e7eb;" : ""} vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${value}</td>
      </tr>`
    )
    .join("");
}

function tourWrapper(title: string, subtitle: string, inner: string) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #1C1C1E; padding: 20px 24px;">
        <span style="color: #D4AF37; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">${title}</span>
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #374151; line-height: 1.6;">${subtitle}</p>
        ${inner}
        <p style="margin: 20px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">
          Notifikasi otomatis dari sistem EL Travel &middot; Mohon tidak membalas email ini.
        </p>
      </div>
    </div>
  `;
}

export async function sendTourInquiryReceivedEmail(inquiry: any) {
  if (!inquiry.customerEmail) return;

  const html = tourWrapper(
    "Permintaan Penawaran Diterima",
    `Halo <strong>${inquiry.customerName}</strong>, permintaan Anda untuk <strong>${inquiry.service?.name || "layanan kami"}</strong> sudah kami terima. Tim kami akan segera mengirimkan penawaran terbaik.`,
    `<div style="background: #F8F9FA; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
        ${tourRows([
          ["Kode Permintaan", inquiry.inquiryCode],
          ["Layanan", inquiry.service?.name || "-"],
          ["Tanggal", formatTourDate(inquiry.startDate) + (inquiry.endDate ? " s/d " + formatTourDate(inquiry.endDate) : "")],
          ["Jumlah Peserta", `${inquiry.paxCount} orang`],
          ["Jumlah Unit", `${inquiry.unitCount || 1} unit`],
        ])}
      </table>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #374151;">
      Cek status permintaan Anda di:
      <a href="${getAppUrl()}/tour/status/${inquiry.inquiryCode}" style="color: #D4AF37; font-weight: 700;">${getAppUrl()}/tour/status/${inquiry.inquiryCode}</a>
    </p>`
  );

  await sendMail(
    inquiry.customerEmail,
    `Permintaan Penawaran ${inquiry.inquiryCode} - EL Travel`,
    html
  );
}

export async function sendTourQuoteEmail(inquiry: any, quote: any) {
  if (!inquiry.customerEmail) return;

  const html = tourWrapper(
    "Penawaran Harga Tour & Sewa",
    `Halo <strong>${inquiry.customerName}</strong>, berikut penawaran harga untuk <strong>${inquiry.service?.name || "layanan Anda"}</strong>.`,
    `<div style="background: #F8F9FA; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
        ${tourRows([
          ["No. Penawaran", quote.quoteNumber],
          ["Tanggal", formatTourDate(inquiry.startDate) + (inquiry.endDate ? " s/d " + formatTourDate(inquiry.endDate) : "")],
          ["Jumlah Peserta", `${inquiry.paxCount} orang`],
          ["Jumlah Unit", `${quote.unitCount || inquiry.unitCount || 1} unit`],
          ["Subtotal", `Rp ${quote.subtotal.toLocaleString("id-ID")}`],
          ...(quote.discountAmount > 0
            ? [["Diskon", `-Rp ${quote.discountAmount.toLocaleString("id-ID")}${quote.discountReason ? ` (${quote.discountReason})` : ""}`] as [string, string]]
            : []),
          ...(quote.validUntil ? [["Berlaku Sampai", formatTourDate(quote.validUntil)] as [string, string]] : []),
        ])}
      </table>
      <p style="margin: 16px 0 0 0; font-size: 16px; font-weight: 700; color: #D4AF37;">Total: Rp ${quote.totalPrice.toLocaleString("id-ID")}</p>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #374151;">
      Terima atau tolak penawaran di:
      <a href="${getAppUrl()}/tour/status/${inquiry.inquiryCode}" style="color: #D4AF37; font-weight: 700;">${getAppUrl()}/tour/status/${inquiry.inquiryCode}</a>
    </p>`
  );

  await sendMail(
    inquiry.customerEmail,
    `Penawaran Harga ${quote.quoteNumber} - EL Travel`,
    html
  );
}

export async function sendTourBookingEmail(booking: any) {
  if (!booking.customerEmail) return;

  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
  const html = tourWrapper(
    isConfirmed ? "Pembayaran Dikonfirmasi" : "Booking Dibuat - Menunggu Pembayaran",
    isConfirmed
      ? `Halo <strong>${booking.customerName}</strong>, pembayaran Anda telah kami terima. Berikut detail booking Anda.`
      : `Halo <strong>${booking.customerName}</strong>, booking Anda telah tercatat. Silakan selesaikan pembayaran sesuai instruksi.`,
    `<div style="background: #F8F9FA; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
        ${tourRows([
          ["Kode Booking", booking.bookingCode],
          ["Layanan", booking.serviceName],
          ["Tanggal", formatTourDate(booking.startDate) + (booking.endDate ? " s/d " + formatTourDate(booking.endDate) : "")],
          ["Jumlah Peserta", `${booking.paxCount} orang`],
          ["Jumlah Unit", `${booking.unitCount || 1} unit`],
          ...(booking.pickupLocation ? [["Penjemputan", booking.pickupLocation] as [string, string]] : []),
          ["Metode Bayar", booking.paymentMethod || "-"],
          ["Status", booking.status],
        ])}
      </table>
      <p style="margin: 16px 0 0 0; font-size: 16px; font-weight: 700; color: #D4AF37;">Total: Rp ${booking.totalPrice.toLocaleString("id-ID")}</p>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #374151;">
      Detail & instruksi pembayaran:
      <a href="${getAppUrl()}/tour/booking/${booking.bookingCode}" style="color: #D4AF37; font-weight: 700;">${getAppUrl()}/tour/booking/${booking.bookingCode}</a>
    </p>`
  );

  await sendMail(
    booking.customerEmail,
    `${isConfirmed ? "Booking Terkonfirmasi" : "Booking Dibuat"} ${booking.bookingCode} - EL Travel`,
    html
  );
}

export async function sendAdminTourInquiryEmail(inquiry: any) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = tourWrapper(
    "Permintaan Tour/Sewa Baru",
    `Permintaan penawaran baru masuk dari <strong>${inquiry.customerName}</strong>.`,
    `<div style="background: #F8F9FA; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
        ${tourRows([
          ["Kode", inquiry.inquiryCode],
          ["Layanan", inquiry.service?.name || "-"],
          ["Pemesan", inquiry.customerName],
          ["Telepon", inquiry.customerPhone || "-"],
          ["Email", inquiry.customerEmail || "-"],
          ["Tanggal", formatTourDate(inquiry.startDate) + (inquiry.endDate ? " s/d " + formatTourDate(inquiry.endDate) : "")],
          ["Peserta", `${inquiry.paxCount} orang`],
          ["Jumlah Unit", `${inquiry.unitCount || 1} unit`],
          ["Penjemputan", inquiry.pickupLocation || "-"],
          ["Catatan", inquiry.notes || "-"],
        ])}
      </table>
    </div>`
  );

  await sendMail(adminEmail, `[INQUIRY TOUR] ${inquiry.inquiryCode} - ${inquiry.customerName}`, html);
}

export async function sendAdminTourBookingEmail(booking: any) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = tourWrapper(
    "Booking Tour/Sewa Baru",
    `Booking baru masuk dari <strong>${booking.customerName}</strong> dengan status <strong>${booking.status}</strong>.`,
    `<div style="background: #F8F9FA; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
        ${tourRows([
          ["Kode Booking", booking.bookingCode],
          ["Layanan", booking.serviceName],
          ["Pemesan", booking.customerName],
          ["Telepon", booking.customerPhone || "-"],
          ["Email", booking.customerEmail || "-"],
          ["Tanggal", formatTourDate(booking.startDate) + (booking.endDate ? " s/d " + formatTourDate(booking.endDate) : "")],
          ["Peserta", `${booking.paxCount} orang`],
          ["Jumlah Unit", `${booking.unitCount || 1} unit`],
          ["Metode Bayar", booking.paymentMethod || "-"],
          ["Total", `Rp ${booking.totalPrice.toLocaleString("id-ID")}`],
        ])}
      </table>
    </div>`
  );

  await sendMail(adminEmail, `[BOOKING TOUR] ${booking.bookingCode} - ${booking.customerName}`, html);
}
