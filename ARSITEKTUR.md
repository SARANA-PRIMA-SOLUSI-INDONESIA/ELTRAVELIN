# Arsitektur Project EL Travel

## Overview
EL Travel adalah aplikasi booking travel premium berbasis web yang dibangun dengan Next.js 16 dan App Router. Aplikasi ini menyediakan layanan pemesanan tiket travel dengan fitur lengkap termasuk pembayaran online, notifikasi WhatsApp, dan panel admin.

## Tech Stack

### Frontend
- **Framework**: Next.js 16.2.3 dengan App Router (React 19.2.4)
- **Styling**: Tailwind CSS v4
- **Icons**: Remix Icon
- **Fonts**: Manrope (display), Inter (body)
- **PWA**: Progressive Web App support dengan manifest

### Backend
- **Runtime**: Next.js Server Components & API Routes
- **Database**: PostgreSQL via Prisma 7.7.0
- **ORM**: Prisma Client dengan @prisma/adapter-pg
- **Authentication**: JWT via jose library

### Integrasi Pihak Ketiga
- **Payment Gateway**: Midtrans (Snap)
- **WhatsApp**: StarSender API
- **Email**: Nodemailer
- **Storage**: Supabase Storage & Vercel Blob
- **File Processing**: xlsx untuk export data

## Struktur Project

```
eltravelin/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   │   ├── admin-master.ts       # Manajemen master data
│   │   ├── admin-promo.ts        # Manajemen promo code
│   │   ├── banner.ts             # Manajemen banner
│   │   ├── booking.ts            # Logic booking
│   │   ├── export.ts             # Export data ke Excel
│   │   ├── test-wa.ts            # Test WhatsApp
│   │   └── trigger-cron.ts       # Trigger cron job
│   ├── admin/                    # Admin Panel
│   │   ├── login/                # Halaman login admin
│   │   └── (protected)/          # Routes terproteksi
│   │       ├── bookings/         # Manajemen booking
│   │       ├── master/           # Master data (rute, kendaraan, dll)
│   │       ├── promos/           # Manajemen promo
│   │       ├── schedules/        # Manajemen jadwal
│   │       └── test-wa/          # Test WhatsApp
│   ├── api/                      # API Routes
│   │   ├── admin/                # Admin API
│   │   │   ├── login/            # Login endpoint
│   │   │   └── schedules/        # Schedule API
│   │   ├── cron/                 # Cron jobs
│   │   │   └── process-bookings/ # Proses booking otomatis
│   │   ├── webhooks/             # Webhook handlers
│   │   │   ├── midtrans/         # Midtrans payment webhook
│   │   │   └── moota/            # Moota payment webhook
│   │   └── debug/                # Debug endpoints
│   ├── about/                    # Halaman About
│   ├── booking/                  # Halaman booking
│   ├── checkout/                 # Halaman checkout
│   ├── confirmation/             # Halaman konfirmasi
│   ├── fleet/                    # Halaman armada
│   ├── payment/                  # Halaman pembayaran
│   ├── routes/                   # Halaman rute
│   ├── search/                   # Halaman pencarian
│   ├── seat-selection/          # Halaman pemilihan kursi
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles
├── components/                   # React Components
│   ├── BookingWizard.tsx         # Wizard booking
│   ├── Calendar.tsx              # Komponen kalender
│   ├── CheckoutForm.tsx          # Form checkout
│   ├── Footer.tsx                # Footer
│   ├── Input.tsx                 # Input component
│   ├── Navbar.tsx                # Navbar
│   ├── PWAInstall.tsx            # PWA install prompt
│   ├── Pagination.tsx            # Pagination
│   ├── PromoBanner.tsx           # Banner promo
│   ├── RouteCard.tsx             # Card rute
│   ├── RouteSlider.tsx           # Slider rute
│   ├── ScheduleCard.tsx          # Card jadwal
│   ├── SearchFilter.tsx         # Filter pencarian
│   ├── SearchHero.tsx            # Hero search
│   ├── SeatGrid.tsx              # Grid kursi
│   └── admin/                    # Admin components
├── lib/                          # Utility Libraries
│   ├── auth.ts                   # JWT authentication
│   ├── mail.ts                   # Email utilities
│   ├── midtrans.ts               # Midtrans client
│   ├── on-demand-schedules.ts    # Materialisasi jadwal on-demand (per tanggal)
│   ├── driver-scheduling.ts      # Engine feasibilitas & auto-assign driver
│   ├── prisma.ts                 # Prisma client initialization
│   └── whatsapp.ts               # WhatsApp utilities
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Tailwind config
└── tsconfig.json                 # TypeScript config
```

## Database Schema

### Core Models

#### Route & Stops
- **Route**: Rute perjalanan (origin, destination)
- **RouteStop**: Titik pemberhentian dalam rute

#### Schedule Management
- **Schedule**: Jadwal perjalanan spesifik dengan tanggal
- **ScheduleTemplate**: Template jadwal untuk generate schedule berulang
- **OperatingTrip**: Trip operasional harian dengan kendaraan

#### Booking System
- **Booking**: Data booking tiket
- **Passenger**: Data penumpang per booking
- **Seat**: Status kursi per operating trip

#### Vehicle Management
- **Vehicle**: Data kendaraan/armada

#### Marketing
- **PromoCode**: Kode promo diskon
- **Banner**: Banner promosi di homepage

#### Admin
- **Admin**: User admin untuk manajemen sistem

### Enums
- **BookingStatus**: PENDING, CONFIRMED, CANCELLED, COMPLETED
- **SeatStatus**: AVAILABLE, BOOKED, BLOCKED
- **TripStatus**: SCHEDULED, IN_TRANSIT, COMPLETED, CANCELLED

## Alur Booking

1. **Search**: User mencari rute dan tanggal di homepage
2. **Schedule Selection**: User memilih jadwal yang tersedia
3. **Seat Selection**: User memilih kursi dari grid kursi
4. **Checkout**: User mengisi data kontak dan penumpang
5. **Payment**: User melakukan pembayaran via Midtrans
6. **Confirmation**: Setelah pembayaran sukses, user menerima konfirmasi
7. **Notification**: WhatsApp & email notifikasi dikirim

## Authentication & Authorization

### Admin Authentication
- Menggunakan JWT (JSON Web Token) via library `jose`
- Session disimpan di HTTP-only cookie
- Middleware memproteksi routes `/admin/*` dan `/api/admin/*`
- Token expiration: 2 jam

### Middleware
```typescript
// Proteksi admin routes
- /admin/* (kecuali /admin/login)
- /api/admin/* (kecuali /api/admin/login)
```

## Integrasi Payment

### Midtrans
- **Snap**: Payment popup untuk user
- **Webhook**: `/api/webhooks/midtrans` untuk notifikasi pembayaran
- **Flow**: 
  1. Generate snap token saat checkout
  2. User membayar di Midtrans popup
  3. Midtrans mengirim webhook ke server
  4. Update status booking berdasarkan payment status

## Integrasi Notification

### WhatsApp (StarSender API)
- **Endpoint**: `lib/whatsapp.ts`
- **Fungsi**: 
  - `sendWhatsAppMessage()`: Kirim pesan WhatsApp
  - `sendBookingSuccessMessage()`: Kirim konfirmasi booking
- **Format**: Format nomor Indonesia (62...)

### Email (Nodemailer)
- **Endpoint**: `lib/mail.ts`
- **Fungsi**: Kirim email konfirmasi dan notifikasi

## Server Actions

### Booking Flow
- **booking.ts**: Handle logic booking termasuk:
  - Create booking
  - Update seat status
  - Generate booking code
  - Apply promo code

### Admin Actions
- **admin-master.ts**: CRUD untuk master data (rute, kendaraan, dll)
- **admin-promo.ts**: Manajemen promo code
- **banner.ts**: Manajemen banner homepage
- **export.ts**: Export data ke Excel

## Cron Jobs

### Process Bookings
- **Endpoint**: `/api/cron/process-bookings`
- **Fungsi**: Proses booking otomatis (reminder, cleanup, dll)
- **Trigger**: Dapat di-trigger manual via action atau external cron

### Sync Schedules & Driver
- **Endpoint**: `/api/cron/sync-schedules`
- **Fungsi**: Setiap malam materialisasi jadwal H+1 s/d H+14 (`DRIVER_PLANNING_DAYS`) lalu auto-assign driver otomatis untuk rentang tersebut (hanya slot kosong).
- **Auth**: Wajib `Authorization: Bearer <CRON_SECRET>` (atau `x-cron-key` / query `?key=`).
- **Trigger**: Website cron job eksternal, misal tiap hari 05:00 WIB.
- **Window**: Booking H+1..H+30 on-demand (`BOOKING_WINDOW_DAYS`), armada/driver H+1..H+14 (`DRIVER_PLANNING_DAYS`).

## API Routes

### Public Routes
- `/api/webhooks/midtrans`: Webhook pembayaran Midtrans
- `/api/webhooks/moota`: Webhook pembayaran Moota

### Admin Routes (Protected)
- `/api/admin/login`: Login admin
- `/api/admin/schedules`: CRUD jadwal

## Styling System

### Design Tokens (CSS Variables)
```css
:root {
  --navy-deep: #0A1628;
  --gold-warm: #D4AF37;
  --gold-soft: #F5E6C8;
  --surface-low: #F8F9FA;
  --surface-high: #FFFFFF;
}
```

### Component Patterns
- Server Components untuk data fetching
- Client Components untuk interactivity
- Reusable components di `components/`

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct database URL for Prisma
- `JWT_SECRET`: Secret key untuk JWT
- `MIDTRANS_SERVER_KEY`: Midtrans server key
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`: Midtrans client key
- `MIDTRANS_IS_PRODUCTION`: Mode produksi Midtrans
- `STARSENDER_API_KEY`: API key WhatsApp
- `NEXT_PUBLIC_APP_URL`: Base URL aplikasi
- Email configuration variables (SMTP)

## Deployment

### Build Process
```bash
npm run build  # Runs: prisma generate && next build
```

### Deployment Platform
- Vercel (recommended)
- Support untuk PWA
- Environment variables configuration

## Security Considerations

1. **Authentication**: JWT dengan HTTP-only cookies
2. **Authorization**: Middleware untuk proteksi routes
3. **Input Validation**: Server-side validation di actions
4. **SQL Injection**: Prisma ORM provides protection
5. **CORS**: Next.js handles CORS automatically
6. **Environment Variables**: Sensitive data di environment variables

## Performance Optimizations

1. **Server Components**: Reduce client-side JavaScript
2. **Image Optimization**: Next.js Image component
3. **Database Connection**: Prisma connection pooling
4. **Static Generation**: Homepage dan static pages
5. **Code Splitting**: Automatic via Next.js

## Future Enhancements

1. **Real-time Updates**: WebSocket untuk seat availability
2. **Mobile App**: React Native atau PWA enhanced
3. **Analytics**: Dashboard analytics untuk admin
4. **Multi-language**: Support bahasa lain
5. **Loyalty Program**: Sistem poin dan reward
6. **Dynamic Pricing**: Harga berdasarkan demand

## Development Workflow

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed

# Build for production
pnpm build

# Run linting
pnpm lint
```

## Testing

- Manual testing via admin panel
- WhatsApp test endpoint: `/admin/test-wa`
- Debug endpoints di `/api/debug/`

## Monitoring & Logging

- Console logging untuk debugging
- Error handling di API routes
- Midtrans webhook logging
- WhatsApp API response logging

## File Upload & Storage

- **Vercel Blob**: Untuk file storage
- **Supabase Storage**: Alternative storage solution
- **Payment Proof**: Upload bukti pembayaran

## Export Functionality

- **Excel Export**: Menggunakan library `xlsx`
- **Admin Export**: Export booking data ke Excel
- **Endpoint**: `actions/export.ts`
