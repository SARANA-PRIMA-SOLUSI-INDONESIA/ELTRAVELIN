import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendBookingSuccessMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received Midtrans Webhook:', body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const combined = order_id + status_code + gross_amount + serverKey;
    const hashed = crypto.createHash('sha512').update(combined).digest('hex');

    if (hashed !== signature_key) {
      console.error('Invalid Midtrans Signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // Map transaction_status to our BookingStatus
    // PENDING, CONFIRMED, CANCELLED, COMPLETED
    let bookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" = 'PENDING';
    
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      bookingStatus = 'CONFIRMED';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      bookingStatus = 'CANCELLED';
    } else if (transaction_status === 'pending') {
      bookingStatus = 'PENDING';
    }

    const updatedBooking = await prisma.booking.update({
      where: { bookingCode: order_id },
      data: { 
        status: bookingStatus,
        paymentType: payment_type,
        settlementTime: (transaction_status === 'settlement' || transaction_status === 'capture') ? new Date() : null
      },
      include: {
        schedule: {
          include: {
            route: true
          }
        },
        seats: true
      }
    });

    if (bookingStatus === 'CONFIRMED') {
      sendBookingSuccessMessage(updatedBooking).catch(err => console.error("Error sending Midtrans WA success:", err));
    }

    console.log(`Booking ${order_id} updated to ${bookingStatus}`);

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
