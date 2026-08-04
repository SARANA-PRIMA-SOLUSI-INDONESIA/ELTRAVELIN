const RESEND_API_KEY = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@eltravel.in';
const RESEND_URL = 'https://api.resend.com/emails';

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
      console.error('Resend API error:', JSON.stringify(data));
      return;
    }

    console.log(`Email sent to ${to}, id: ${data.id}`);
  } catch (error) {
    console.error('Failed to send email:', error);
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
        <p><strong>Rute:</strong> ${booking.schedule.route.origin} → ${booking.schedule.route.destination}</p>
        <p><strong>Waktu Keberangkatan:</strong> ${new Date(booking.schedule.departureTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <p><strong>Kursi:</strong> ${booking.seats.map((s: any) => s.seatNumber).join(', ')}</p>
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
              <td style="padding: 8px 0 8px 16px; border-top: 1px solid #e5e7eb; vertical-align: top; font-size: 13px; color: #111827; word-break: break-word;">${booking.schedule?.route?.origin || '?'} &rarr; ${booking.schedule?.route?.destination || '?'}</td>
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
