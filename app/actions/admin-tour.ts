"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";
import {
  calcTourDiscount,
  calcTourSubtotal,
  canAccessTourAdmin,
  canManageTourDiscount,
  randomUniqueCode,
  TOUR_PAYMENT_METHODS,
  TOUR_PRICE_UNITS,
  TOUR_SERVICE_TYPES,
  type TourPaymentMethodValue,
} from "@/lib/tour";
import {
  sendAdminTourBookingNotification,
  sendTourBookingConfirmedMessage,
  sendTourBookingPendingMessage,
  sendTourQuoteMessage,
} from "@/lib/whatsapp";
import {
  sendAdminTourBookingEmail,
  sendTourBookingEmail,
  sendTourQuoteEmail,
} from "@/lib/mail";

async function requireTourAdmin() {
  const session = await getSession();
  if (!session || !canAccessTourAdmin(session.role)) {
    throw new Error("Tidak memiliki akses. Silakan login ulang.");
  }
  return session;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

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

function parseOptionalDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ─────────────────────────────────────────────────────────────
// CRUD Layanan
// ─────────────────────────────────────────────────────────────

export interface TourServiceInput {
  type: string;
  name: string;
  shortDesc?: string | null;
  description?: string | null;
  destinations?: string | null;
  durationLabel?: string | null;
  durationDays?: number | null;
  durationNights?: number | null;
  itinerary?: string | null;
  facilities?: string | null;
  includes?: string | null;
  excludes?: string | null;
  basePrice: number;
  priceUnit: string;
  minPax?: number | null;
  maxPax?: number | null;
  vehicleId?: string | null;
  imageUrl?: string | null;
  gallery?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number | null;
}

function normalizeServiceInput(data: TourServiceInput) {
  const name = data.name?.trim();
  if (!name) throw new Error("Nama layanan wajib diisi.");
  if (!TOUR_SERVICE_TYPES.includes(data.type as never)) {
    throw new Error("Tipe layanan tidak valid.");
  }
  if (!TOUR_PRICE_UNITS.includes(data.priceUnit as never)) {
    throw new Error("Satuan harga tidak valid.");
  }
  const basePrice = Math.max(0, Math.round(data.basePrice || 0));
  const minPax = data.minPax ? Math.max(1, Math.round(data.minPax)) : 1;
  const maxPax = data.maxPax ? Math.max(1, Math.round(data.maxPax)) : null;
  if (maxPax && maxPax < minPax) throw new Error("Maksimal pax tidak boleh kurang dari minimal pax.");

  return {
    type: data.type as "TOUR_PACKAGE" | "DAILY_RENTAL",
    name,
    shortDesc: data.shortDesc?.trim() || null,
    description: data.description?.trim() || null,
    destinations: data.destinations?.trim() || null,
    durationLabel: data.durationLabel?.trim() || null,
    durationDays: data.durationDays ? Math.max(1, Math.round(data.durationDays)) : null,
    durationNights: data.durationNights ? Math.max(0, Math.round(data.durationNights)) : null,
    itinerary: data.itinerary?.trim() || null,
    facilities: data.facilities?.trim() || null,
    includes: data.includes?.trim() || null,
    excludes: data.excludes?.trim() || null,
    basePrice,
    priceUnit: data.priceUnit as "PER_PAX" | "PER_VEHICLE" | "PER_DAY",
    minPax,
    maxPax,
    vehicleId: data.vehicleId || null,
    imageUrl: data.imageUrl?.trim() || null,
    gallery: data.gallery?.trim() || null,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    sortOrder: data.sortOrder ? Math.round(data.sortOrder) : 0,
  };
}

export async function createTourService(data: TourServiceInput) {
  await requireTourAdmin();
  const normalized = normalizeServiceInput(data);

  let slug = slugify(normalized.name) || `layanan-${Date.now()}`;
  const existing = await prisma.tourService.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;

  const service = await prisma.tourService.create({ data: { ...normalized, slug } });

  revalidatePath("/admin/tour");
  revalidatePath("/tour");
  revalidatePath("/");
  return { id: service.id, slug: service.slug };
}

export async function updateTourService(id: string, data: TourServiceInput) {
  await requireTourAdmin();
  const normalized = normalizeServiceInput(data);

  const service = await prisma.tourService.findUnique({ where: { id } });
  if (!service) throw new Error("Layanan tidak ditemukan.");

  await prisma.tourService.update({ where: { id }, data: normalized });

  revalidatePath("/admin/tour");
  revalidatePath("/tour");
  revalidatePath(`/tour/${service.slug}`);
  revalidatePath("/");
  return { success: true };
}

export async function toggleTourServiceActive(id: string, isActive: boolean) {
  await requireTourAdmin();
  await prisma.tourService.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/tour");
  revalidatePath("/tour");
  revalidatePath("/");
  return { success: true };
}

export async function toggleTourServiceFeatured(id: string, isFeatured: boolean) {
  await requireTourAdmin();
  await prisma.tourService.update({ where: { id }, data: { isFeatured } });
  revalidatePath("/admin/tour");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTourService(id: string) {
  await requireTourAdmin();

  const bookingCount = await prisma.tourBooking.count({ where: { serviceId: id } });
  if (bookingCount > 0) {
    throw new Error("Layanan sudah memiliki booking. Nonaktifkan saja agar riwayat tetap tersimpan.");
  }

  await prisma.tourService.delete({ where: { id } });
  revalidatePath("/admin/tour");
  revalidatePath("/tour");
  revalidatePath("/");
  return { success: true };
}

export async function uploadTourServiceImage(formData: FormData) {
  await requireTourAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "Pilih file gambar terlebih dahulu." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "File harus berupa gambar." };
  }
  if (file.size > 3 * 1024 * 1024) {
    return { success: false as const, error: "Ukuran gambar maksimal 3 MB." };
  }

  const token =
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_EL_TRAVELIN_READ_WRITE_TOKEN;
  if (!token) {
    return { success: false as const, error: "Vercel Blob belum dikonfigurasi di environment server." };
  }

  try {
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const blob = await put(
      `tour/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`,
      Buffer.from(await file.arrayBuffer()),
      { access: "public", token, contentType: file.type }
    );
    return { success: true as const, url: blob.url };
  } catch (error) {
    console.error("[TOUR] Gagal upload gambar:", error);
    return { success: false as const, error: "Gambar gagal diunggah. Silakan coba lagi." };
  }
}

// ─────────────────────────────────────────────────────────────
// Quote (negosiasi harga)
// ─────────────────────────────────────────────────────────────

export interface TourQuoteInput {
  inquiryId: string;
  pricePerUnit: number;
  unitCount?: number | null;
  discountType?: "FIXED" | "PERCENT" | null;
  discountValue?: number | null;
  discountReason?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  sendNow?: boolean;
}

export async function createTourQuote(data: TourQuoteInput) {
  const session = await requireTourAdmin();

  const inquiry = await prisma.tourInquiry.findUnique({
    where: { id: data.inquiryId },
    include: { service: true },
  });
  if (!inquiry) throw new Error("Permintaan tidak ditemukan.");
  if (inquiry.status === "CONVERTED" || inquiry.status === "ACCEPTED") {
    throw new Error("Permintaan ini sudah menjadi booking.");
  }

  const pricePerUnit = Math.max(0, Math.round(data.pricePerUnit || 0));
  if (pricePerUnit <= 0) throw new Error("Harga penawaran wajib diisi.");

  const unitCount = Math.max(1, Math.round(data.unitCount || inquiry.unitCount || 1));

  const { subtotal } = calcTourSubtotal({
    pricePerUnit,
    priceUnit: inquiry.service.priceUnit,
    paxCount: inquiry.paxCount,
    unitCount,
    startDate: inquiry.startDate,
    endDate: inquiry.endDate,
  });

  let discountType = data.discountType || null;
  let discountValue = Math.round(data.discountValue || 0);
  if (!canManageTourDiscount(session.role)) {
    discountType = null;
    discountValue = 0;
  }
  const discountAmount = calcTourDiscount(subtotal, discountType, discountValue);
  const totalPrice = subtotal - discountAmount;

  const quoteNumber = await generateUniqueCode("QO", async (code) => {
    const existingQuote = await prisma.tourQuote.findUnique({ where: { quoteNumber: code } });
    return Boolean(existingQuote);
  });

  const quote = await prisma.$transaction(async (tx) => {
    // Penawaran lama yang masih terbuka dianggap kedaluwarsa.
    await tx.tourQuote.updateMany({
      where: { inquiryId: inquiry.id, status: { in: ["DRAFT", "SENT"] } },
      data: { status: "EXPIRED" },
    });

    const created = await tx.tourQuote.create({
      data: {
        quoteNumber,
        inquiryId: inquiry.id,
        pricePerUnit,
        unitCount,
        subtotal,
        discountType,
        discountValue,
        discountReason: discountAmount > 0 ? data.discountReason?.trim() || null : null,
        totalPrice,
        validUntil: parseOptionalDate(data.validUntil),
        notes: data.notes?.trim() || null,
        status: data.sendNow ? "SENT" : "DRAFT",
        createdBy: session.email,
      },
    });

    if (data.sendNow) {
      await tx.tourInquiry.update({ where: { id: inquiry.id }, data: { status: "QUOTED" } });
    }

    return created;
  });

  if (data.sendNow) {
    const notifications = await Promise.allSettled([
      sendTourQuoteMessage(inquiry, quote),
      sendTourQuoteEmail(inquiry, quote),
    ]);
    notifications.forEach((result) => {
      if (result.status === "rejected") console.error("[TOUR] Notifikasi quote gagal:", result.reason);
    });
  }

  revalidatePath("/admin/tour/inquiries");
  revalidatePath(`/admin/tour/inquiries/${inquiry.id}`);
  return { id: quote.id, quoteNumber: quote.quoteNumber };
}

export async function updateTourQuote(
  quoteId: string,
  data: Omit<TourQuoteInput, "inquiryId" | "sendNow">
) {
  const session = await requireTourAdmin();

  const quote = await prisma.tourQuote.findUnique({
    where: { id: quoteId },
    include: { inquiry: { include: { service: true } }, bookings: true },
  });
  if (!quote) throw new Error("Penawaran tidak ditemukan.");
  if (quote.bookings.length > 0) throw new Error("Penawaran sudah dipakai untuk booking.");
  if (quote.status === "ACCEPTED") throw new Error("Penawaran sudah diterima customer.");

  const pricePerUnit = Math.max(0, Math.round(data.pricePerUnit || 0));
  if (pricePerUnit <= 0) throw new Error("Harga penawaran wajib diisi.");

  const unitCount = Math.max(1, Math.round(data.unitCount || quote.unitCount || 1));

  const { subtotal } = calcTourSubtotal({
    pricePerUnit,
    priceUnit: quote.inquiry.service.priceUnit,
    paxCount: quote.inquiry.paxCount,
    unitCount,
    startDate: quote.inquiry.startDate,
    endDate: quote.inquiry.endDate,
  });

  let discountType = data.discountType || null;
  let discountValue = Math.round(data.discountValue || 0);
  if (!canManageTourDiscount(session.role)) {
    discountType = null;
    discountValue = 0;
  }
  const discountAmount = calcTourDiscount(subtotal, discountType, discountValue);

  await prisma.tourQuote.update({
    where: { id: quoteId },
    data: {
      pricePerUnit,
      unitCount,
      subtotal,
      discountType,
      discountValue,
      discountReason: discountAmount > 0 ? data.discountReason?.trim() || null : null,
      totalPrice: subtotal - discountAmount,
      validUntil: parseOptionalDate(data.validUntil),
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/admin/tour/inquiries");
  revalidatePath(`/admin/tour/inquiries/${quote.inquiryId}`);
  return { success: true };
}

export async function sendTourQuote(quoteId: string) {
  await requireTourAdmin();

  const quote = await prisma.tourQuote.findUnique({
    where: { id: quoteId },
    include: { inquiry: { include: { service: true } } },
  });
  if (!quote) throw new Error("Penawaran tidak ditemukan.");
  if (quote.status === "ACCEPTED") throw new Error("Penawaran sudah diterima customer.");

  await prisma.$transaction([
    prisma.tourQuote.update({ where: { id: quote.id }, data: { status: "SENT" } }),
    prisma.tourInquiry.update({ where: { id: quote.inquiryId }, data: { status: "QUOTED" } }),
  ]);

  const notifications = await Promise.allSettled([
    sendTourQuoteMessage(quote.inquiry, quote),
    sendTourQuoteEmail(quote.inquiry, quote),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi quote gagal:", result.reason);
  });

  revalidatePath("/admin/tour/inquiries");
  revalidatePath(`/admin/tour/inquiries/${quote.inquiryId}`);
  return { success: true };
}

export async function deleteTourQuote(quoteId: string) {
  await requireTourAdmin();

  const quote = await prisma.tourQuote.findUnique({
    where: { id: quoteId },
    include: { bookings: true },
  });
  if (!quote) throw new Error("Penawaran tidak ditemukan.");
  if (quote.bookings.length > 0) throw new Error("Penawaran sudah dipakai untuk booking.");

  await prisma.tourQuote.delete({ where: { id: quoteId } });

  revalidatePath("/admin/tour/inquiries");
  revalidatePath(`/admin/tour/inquiries/${quote.inquiryId}`);
  return { success: true };
}

export async function rejectTourInquiry(inquiryId: string, reason?: string) {
  await requireTourAdmin();

  const inquiry = await prisma.tourInquiry.findUnique({
    where: { id: inquiryId },
    include: { bookings: true },
  });
  if (!inquiry) throw new Error("Permintaan tidak ditemukan.");
  if (inquiry.bookings.length > 0) throw new Error("Permintaan sudah menjadi booking.");

  await prisma.$transaction([
    prisma.tourInquiry.update({
      where: { id: inquiryId },
      data: { status: "REJECTED", notes: reason?.trim() || inquiry.notes },
    }),
    prisma.tourQuote.updateMany({
      where: { inquiryId, status: { in: ["DRAFT", "SENT"] } },
      data: { status: "REJECTED" },
    }),
  ]);

  revalidatePath("/admin/tour/inquiries");
  revalidatePath(`/admin/tour/inquiries/${inquiryId}`);
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Booking manual & konversi quote
// ─────────────────────────────────────────────────────────────

function buildBookingCodeGenerator() {
  return async (code: string) => {
    const existing = await prisma.tourBooking.findUnique({ where: { bookingCode: code } });
    return Boolean(existing);
  };
}

export async function convertQuoteToBooking(
  quoteId: string,
  options: { paymentMethod?: TourPaymentMethodValue | null; markPaid?: boolean } = {}
) {
  const session = await requireTourAdmin();

  const quote = await prisma.tourQuote.findUnique({
    where: { id: quoteId },
    include: { inquiry: { include: { service: true } }, bookings: true },
  });
  if (!quote) throw new Error("Penawaran tidak ditemukan.");
  if (quote.bookings.length > 0) {
    return { bookingCode: quote.bookings[0].bookingCode };
  }

  const inquiry = quote.inquiry;
  const service = inquiry.service;
  const markPaid = Boolean(options.markPaid);
  const paymentMethod = options.paymentMethod || null;
  if (paymentMethod && !TOUR_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error("Metode pembayaran tidak valid.");
  }

  const bookingCode = await generateUniqueCode("TR", buildBookingCodeGenerator());
  const discountAmount = quote.subtotal - quote.totalPrice;
  const uniqueCode = !markPaid && paymentMethod === "MOOTA" ? randomUniqueCode() : 0;

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
        discountAmount,
        discountReason: quote.discountReason,
        totalPrice: quote.totalPrice + uniqueCode,
        status: markPaid ? "CONFIRMED" : "PENDING",
        paymentMethod,
        settlementTime: markPaid ? new Date() : null,
        verifiedBy: markPaid ? session.email : null,
        verifiedAt: markPaid ? new Date() : null,
        notes: inquiry.notes,
      },
    });

    await tx.tourQuote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
    await tx.tourInquiry.update({ where: { id: inquiry.id }, data: { status: "CONVERTED" } });

    return created;
  });

  const notifications = await Promise.allSettled([
    markPaid ? sendTourBookingConfirmedMessage(booking) : sendTourBookingPendingMessage(booking),
    sendTourBookingEmail(booking),
    sendAdminTourBookingNotification(booking),
    sendAdminTourBookingEmail(booking),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi booking gagal:", result.reason);
  });

  revalidatePath("/admin/tour/inquiries");
  revalidatePath(`/admin/tour/inquiries/${inquiry.id}`);
  revalidatePath("/admin/tour/bookings");
  return { bookingCode: booking.bookingCode };
}

export interface AdminTourBookingInput {
  serviceId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  startDate: string;
  endDate?: string | null;
  paxCount: number;
  unitCount?: number | null;
  pickupLocation?: string | null;
  pricePerUnit: number;
  discountType?: "FIXED" | "PERCENT" | null;
  discountValue?: number | null;
  discountReason?: string | null;
  paymentMethod: TourPaymentMethodValue;
  markPaid?: boolean;
  notes?: string | null;
}

export async function adminCreateTourBooking(data: AdminTourBookingInput) {
  const session = await requireTourAdmin();

  const service = await prisma.tourService.findUnique({ where: { id: data.serviceId } });
  if (!service) throw new Error("Layanan tidak ditemukan.");

  const name = data.customerName?.trim();
  const phone = data.customerPhone?.trim();
  if (!name) throw new Error("Nama pemesan wajib diisi.");
  if (!phone) throw new Error("Nomor WhatsApp wajib diisi.");

  const startDate = new Date(data.startDate);
  if (Number.isNaN(startDate.getTime())) throw new Error("Tanggal mulai tidak valid.");
  const endDate = parseOptionalDate(data.endDate);

  const paxCount = Math.max(1, Math.round(data.paxCount || 1));
  const unitCount = Math.max(1, Math.round(data.unitCount || 1));
  const pricePerUnit = Math.max(0, Math.round(data.pricePerUnit || 0));
  if (pricePerUnit <= 0) throw new Error("Harga wajib diisi.");

  const { subtotal } = calcTourSubtotal({
    pricePerUnit,
    priceUnit: service.priceUnit,
    paxCount,
    unitCount,
    startDate,
    endDate,
  });

  let discountType = data.discountType || null;
  let discountValue = Math.round(data.discountValue || 0);
  if (!canManageTourDiscount(session.role)) {
    discountType = null;
    discountValue = 0;
  }
  const discountAmount = calcTourDiscount(subtotal, discountType, discountValue);

  if (!TOUR_PAYMENT_METHODS.includes(data.paymentMethod)) {
    throw new Error("Metode pembayaran tidak valid.");
  }

  const markPaid = Boolean(data.markPaid);
  const bookingCode = await generateUniqueCode("TR", buildBookingCodeGenerator());
  const uniqueCode = !markPaid && data.paymentMethod === "MOOTA" ? randomUniqueCode() : 0;

  const booking = await prisma.tourBooking.create({
    data: {
      bookingCode,
      serviceId: service.id,
      serviceName: service.name,
      serviceType: service.type,
      startDate,
      endDate,
      paxCount,
      unitCount,
      pickupLocation: data.pickupLocation?.trim() || null,
      customerName: name,
      customerEmail: data.customerEmail?.trim() || null,
      customerPhone: phone,
      basePrice: subtotal,
      discountAmount,
      discountReason: discountAmount > 0 ? data.discountReason?.trim() || null : null,
      totalPrice: subtotal - discountAmount + uniqueCode,
      status: markPaid ? "CONFIRMED" : "PENDING",
      paymentMethod: data.paymentMethod,
      settlementTime: markPaid ? new Date() : null,
      verifiedBy: markPaid ? session.email : null,
      verifiedAt: markPaid ? new Date() : null,
      notes: data.notes?.trim() || null,
      createdByAdmin: session.email,
    },
  });

  const notifications = await Promise.allSettled([
    markPaid ? sendTourBookingConfirmedMessage(booking) : sendTourBookingPendingMessage(booking),
    sendTourBookingEmail(booking),
    sendAdminTourBookingNotification(booking),
    sendAdminTourBookingEmail(booking),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi booking gagal:", result.reason);
  });

  revalidatePath("/admin/tour/bookings");
  return { bookingCode: booking.bookingCode };
}

export async function verifyTourPayment(bookingId: string, note?: string) {
  const session = await requireTourAdmin();

  const booking = await prisma.tourBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking tidak ditemukan.");
  if (booking.status === "CONFIRMED") return { success: true };

  const updated = await prisma.tourBooking.update({
    where: { id: bookingId },
    data: {
      status: "CONFIRMED",
      paymentNote: note?.trim() || booking.paymentNote,
      verifiedBy: session.email,
      verifiedAt: new Date(),
      settlementTime: new Date(),
    },
  });

  const notifications = await Promise.allSettled([
    sendTourBookingConfirmedMessage(updated),
    sendTourBookingEmail(updated),
    sendAdminTourBookingNotification(updated),
    sendAdminTourBookingEmail(updated),
  ]);
  notifications.forEach((result) => {
    if (result.status === "rejected") console.error("[TOUR] Notifikasi konfirmasi gagal:", result.reason);
  });

  revalidatePath("/admin/tour/bookings");
  revalidatePath(`/admin/tour/bookings/${bookingId}`);
  return { success: true };
}

export async function updateTourBookingStatus(
  bookingId: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
) {
  await requireTourAdmin();

  const booking = await prisma.tourBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking tidak ditemukan.");

  await prisma.tourBooking.update({ where: { id: bookingId }, data: { status } });

  revalidatePath("/admin/tour/bookings");
  revalidatePath(`/admin/tour/bookings/${bookingId}`);
  return { success: true };
}

export async function updateTourBookingPaymentProof(bookingId: string, proofUrl: string) {
  await requireTourAdmin();
  await prisma.tourBooking.update({
    where: { id: bookingId },
    data: { paymentProofUrl: proofUrl },
  });
  revalidatePath(`/admin/tour/bookings/${bookingId}`);
  return { success: true };
}

export async function deleteTourBooking(bookingId: string) {
  await requireTourAdmin();

  const booking = await prisma.tourBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking tidak ditemukan.");

  await prisma.tourBooking.delete({ where: { id: bookingId } });

  revalidatePath("/admin/tour/bookings");
  return { success: true };
}
