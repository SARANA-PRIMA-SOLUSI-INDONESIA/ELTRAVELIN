"use server";

import { prisma } from "@/lib/prisma";
import type { TourBooking } from "@prisma/client";
import {
  calcTourSubtotal,
  randomUniqueCode,
  TOUR_PAYMENT_METHODS,
  type TourPaymentMethodValue,
} from "@/lib/tour";
import {
  sendAdminTourBookingNotification,
  sendAdminTourInquiryNotification,
  sendTourBookingConfirmedMessage,
  sendTourBookingPendingMessage,
  sendTourInquiryReceivedMessage,
} from "@/lib/whatsapp";
import {
  sendAdminTourBookingEmail,
  sendAdminTourInquiryEmail,
  sendTourBookingEmail,
  sendTourInquiryReceivedEmail,
} from "@/lib/mail";

async function generateUniqueCode(
  prefix: string,
  exists: (code: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!(await exists(code))) return code;
  }
  throw new Error("Gagal membuat kode unik. Silakan coba lagi.");
}

// ─────────────────────────────────────────────────────────────
// Katalog publik
// ─────────────────────────────────────────────────────────────

export async function getTourServices(type?: "TOUR_PACKAGE" | "DAILY_RENTAL") {
  return prisma.tourService.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getFeaturedTourServices(limit = 4) {
  return prisma.tourService.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getTourServiceBySlug(slug: string) {
  return prisma.tourService.findFirst({ where: { slug, isActive: true } });
}

// ─────────────────────────────────────────────────────────────
// Inquiry
// ─────────────────────────────────────────────────────────────

export interface TourInquiryInput {
  serviceId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  startDate: string;
  endDate?: string | null;
  paxCount: number;
  unitCount?: number | null;
  pickupLocation?: string | null;
  notes?: string | null;
}

export async function createTourInquiry(data: TourInquiryInput) {
  const service = await prisma.tourService.findFirst({
    where: { id: data.serviceId, isActive: true },
  });
  if (!service) throw new Error("Layanan tidak ditemukan atau sudah tidak aktif.");

  const name = data.customerName?.trim();
  const phone = data.customerPhone?.trim();
  if (!name) throw new Error("Nama pemesan wajib diisi.");
  if (!phone) throw new Error("Nomor WhatsApp wajib diisi.");

  const startDate = new Date(data.startDate);
  if (Number.isNaN(startDate.getTime())) throw new Error("Tanggal mulai tidak valid.");

  const endDate = data.endDate ? new Date(data.endDate) : null;
  if (endDate && Number.isNaN(endDate.getTime())) throw new Error("Tanggal selesai tidak valid.");
  if (endDate && endDate.getTime() < startDate.getTime()) {
    throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (startDate.getTime() < todayStart.getTime()) {
    throw new Error("Tanggal mulai tidak boleh di masa lalu.");
  }

  const paxCount = Math.max(1, Math.round(data.paxCount || 1));
  const unitCount = Math.max(1, Math.round(data.unitCount || 1));
  if (service.minPax && paxCount < service.minPax) {
    throw new Error(`Minimal pemesanan ${service.minPax} orang.`);
  }
  if (service.maxPax && paxCount > service.maxPax * unitCount) {
    throw new Error(
      `Maksimal pemesanan ${service.maxPax} orang per unit (${service.maxPax * unitCount} orang untuk ${unitCount} unit).`
    );
  }

  const { subtotal } = calcTourSubtotal({
    pricePerUnit: service.basePrice,
    priceUnit: service.priceUnit,
    paxCount,
    unitCount,
    startDate,
    endDate,
  });

  const inquiryCode = await generateUniqueCode("TQ", async (code) => {
    const existing = await prisma.tourInquiry.findUnique({ where: { inquiryCode: code } });
    return Boolean(existing);
  });

  const inquiry = await prisma.tourInquiry.create({
    data: {
      inquiryCode,
      serviceId: service.id,
      customerName: name,
      customerEmail: data.customerEmail?.trim() || null,
      customerPhone: phone,
      startDate,
      endDate,
      paxCount,
      unitCount,
      pickupLocation: data.pickupLocation?.trim() || null,
      notes: data.notes?.trim() || null,
      basePrice: subtotal,
      status: "NEW",
    },
    include: { service: true },
  });

  const notifications = await Promise.allSettled([
    sendTourInquiryReceivedMessage(inquiry),
    sendTourInquiryReceivedEmail(inquiry),
    sendAdminTourInquiryNotification(inquiry),
    sendAdminTourInquiryEmail(inquiry),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi inquiry gagal:", result.reason);
  });

  return { inquiryCode: inquiry.inquiryCode };
}

export async function getTourInquiryByCode(code: string) {
  if (!code) return null;
  return prisma.tourInquiry.findUnique({
    where: { inquiryCode: code },
    include: {
      service: true,
      quotes: { orderBy: { createdAt: "desc" } },
      bookings: { orderBy: { createdAt: "desc" } },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Quote acceptance & booking
// ─────────────────────────────────────────────────────────────

export async function acceptTourQuote(
  quoteId: string,
  paymentMethod: TourPaymentMethodValue
) {
  if (!TOUR_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error("Metode pembayaran tidak valid.");
  }

  const quote = await prisma.tourQuote.findUnique({
    where: { id: quoteId },
    include: { inquiry: { include: { service: true } }, bookings: true },
  });
  if (!quote) throw new Error("Penawaran tidak ditemukan.");

  if (quote.bookings.length > 0) {
    return { bookingCode: quote.bookings[0].bookingCode };
  }

  if (quote.status !== "SENT") {
    throw new Error("Penawaran belum dikirim atau sudah tidak aktif.");
  }
  if (quote.validUntil && quote.validUntil.getTime() < Date.now()) {
    await prisma.tourQuote.update({ where: { id: quote.id }, data: { status: "EXPIRED" } });
    throw new Error("Penawaran sudah kedaluwarsa. Silakan ajukan permintaan baru.");
  }

  const inquiry = quote.inquiry;
  const service = inquiry.service;

  const bookingCode = await generateUniqueCode("TR", async (code) => {
    const existing = await prisma.tourBooking.findUnique({ where: { bookingCode: code } });
    return Boolean(existing);
  });

  const uniqueCode = paymentMethod === "MOOTA" ? randomUniqueCode() : 0;
  const totalPrice = quote.totalPrice + uniqueCode;

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.tourBooking.create({
      data: {
        bookingCode,
        inquiryId: inquiry.id,
        quoteId: quote.id,
        serviceId: service.id,
        serviceName: service.name,
        serviceType: service.type,
        startDate: inquiry.startDate,
        endDate: inquiry.endDate,
        paxCount: inquiry.paxCount,
        unitCount: quote.unitCount,
        pickupLocation: inquiry.pickupLocation,
        customerName: inquiry.customerName,
        customerEmail: inquiry.customerEmail,
        customerPhone: inquiry.customerPhone,
        basePrice: quote.subtotal,
        discountAmount: quote.subtotal - quote.totalPrice,
        discountReason: quote.discountReason,
        totalPrice,
        status: "PENDING",
        paymentMethod,
        notes: inquiry.notes,
      },
    });

    await tx.tourQuote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
    await tx.tourInquiry.update({ where: { id: inquiry.id }, data: { status: "ACCEPTED" } });

    return created;
  });

  const notifications = await Promise.allSettled([
    sendTourBookingPendingMessage(booking),
    sendTourBookingEmail(booking),
    sendAdminTourBookingNotification(booking),
    sendAdminTourBookingEmail(booking),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi booking gagal:", result.reason);
  });

  return { bookingCode: booking.bookingCode };
}

export async function rejectTourQuote(quoteId: string, reason?: string) {
  const quote = await prisma.tourQuote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Penawaran tidak ditemukan.");
  if (quote.status === "ACCEPTED") throw new Error("Penawaran sudah diterima.");

  await prisma.$transaction([
    prisma.tourQuote.update({
      where: { id: quote.id },
      data: { status: "REJECTED", notes: reason?.trim() || quote.notes },
    }),
    prisma.tourInquiry.update({ where: { id: quote.inquiryId }, data: { status: "REJECTED" } }),
  ]);

  return { success: true };
}

export async function getTourBookingByCode(code: string) {
  if (!code) return null;
  return prisma.tourBooking.findUnique({
    where: { bookingCode: code },
    include: { service: true, inquiry: true, quote: true },
  });
}

export async function updateTourPaymentMethod(
  bookingCode: string,
  paymentMethod: TourPaymentMethodValue
) {
  if (!TOUR_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error("Metode pembayaran tidak valid.");
  }

  const booking = await prisma.tourBooking.findUnique({ where: { bookingCode } });
  if (!booking) throw new Error("Booking tidak ditemukan.");
  if (booking.status !== "PENDING") throw new Error("Booking sudah tidak bisa diubah.");

  // Kode unik 3 digit hanya untuk rekonsiliasi transfer bank (MOOTA).
  const baseTotal = booking.basePrice - booking.discountAmount;
  const totalPrice = paymentMethod === "MOOTA" ? baseTotal + randomUniqueCode() : baseTotal;

  const updated = await prisma.tourBooking.update({
    where: { id: booking.id },
    data: { paymentMethod, totalPrice },
  });

  return { bookingCode: updated.bookingCode, totalPrice: updated.totalPrice };
}

async function notifyTourBookingConfirmed(booking: TourBooking) {
  const notifications = await Promise.allSettled([
    sendTourBookingConfirmedMessage(booking),
    sendTourBookingEmail(booking),
    sendAdminTourBookingNotification(booking),
    sendAdminTourBookingEmail(booking),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi konfirmasi gagal:", result.reason);
  });
}

/** Customer mengunggah bukti transfer untuk verifikasi manual admin. */
export async function uploadTourPaymentProof(formData: FormData) {
  const { put } = await import("@vercel/blob");

  const bookingCode = String(formData.get("bookingCode") || "");
  const file = formData.get("file");

  if (!bookingCode) return { success: false as const, error: "Kode booking tidak ditemukan." };
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "Pilih file bukti transfer terlebih dahulu." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "File bukti transfer harus berupa gambar." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { success: false as const, error: "Ukuran gambar maksimal 4 MB." };
  }

  const booking = await prisma.tourBooking.findUnique({ where: { bookingCode } });
  if (!booking) return { success: false as const, error: "Booking tidak ditemukan." };
  if (booking.status !== "PENDING") {
    return { success: false as const, error: "Booking sudah tidak menunggu pembayaran." };
  }

  const token =
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_EL_TRAVELIN_READ_WRITE_TOKEN;
  if (!token) {
    return { success: false as const, error: "Penyimpanan file belum dikonfigurasi." };
  }

  try {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const blob = await put(
      `tour-proof/${bookingCode}-${Date.now()}.${extension}`,
      Buffer.from(await file.arrayBuffer()),
      { access: "public", token, contentType: file.type }
    );

    await prisma.tourBooking.update({
      where: { id: booking.id },
      data: { paymentProofUrl: blob.url, paymentMethod: booking.paymentMethod || "MANUAL" },
    });

    return { success: true as const, url: blob.url };
  } catch (error) {
    console.error("[TOUR] Gagal upload bukti transfer:", error);
    return { success: false as const, error: "Bukti transfer gagal diunggah. Silakan coba lagi." };
  }
}

/** Dipakai webhook Moota: konfirmasi booking PENDING + kirim notifikasi. */
export async function confirmTourBookingBySystem(bookingCode: string, settlementTime?: Date) {
  const booking = await prisma.tourBooking.findUnique({ where: { bookingCode } });
  if (!booking) return null;
  if (booking.status !== "PENDING") return booking;

  const updated = await prisma.tourBooking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      settlementTime: settlementTime ?? new Date(),
    },
  });

  await notifyTourBookingConfirmed(updated);
  return updated;
}
