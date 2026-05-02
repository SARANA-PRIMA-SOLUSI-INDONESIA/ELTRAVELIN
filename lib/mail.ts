import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendETicket(booking: any) {
  if (!booking.contactEmail) return;

  const mailOptions = {
    from: `"EL Travel" <${process.env.SMTP_FROM || 'noreply@eltravelin.com'}>`,
    to: booking.contactEmail,
    subject: `E-Ticket Booking ${booking.bookingCode} - EL Travel`,
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-Ticket sent to ${booking.contactEmail}`);
  } catch (error) {
    console.error('Failed to send E-Ticket:', error);
  }
}

export async function sendPaymentReminder(booking: any) {
  if (!booking.contactEmail) return;

  const mailOptions = {
    from: `"EL Travel" <${process.env.SMTP_FROM || 'noreply@eltravelin.com'}>`,
    to: booking.contactEmail,
    subject: `Reminder Pembayaran Booking ${booking.bookingCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1C1C1E;">Selesaikan Pembayaran Anda</h2>
        <p>Halo <strong>${booking.contactName}</strong>,</p>
        <p>Kami melihat Anda memiliki booking yang belum dibayar dengan kode: <strong>${booking.bookingCode}</strong>.</p>
        
        <p style="color: #D32F2F; font-weight: bold;">Mohon segera lakukan pembayaran dalam 15 menit ke depan atau booking Anda akan otomatis dibatalkan oleh sistem.</p>
        
        <p>Abaikan email ini jika Anda sudah melakukan pembayaran.</p>
        <p>Terima kasih,</p>
        <p>EL Travel Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Payment reminder sent to ${booking.contactEmail}`);
  } catch (error) {
    console.error('Failed to send reminder email:', error);
  }
}
