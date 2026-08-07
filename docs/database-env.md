# Konfigurasi Environment (DEV vs PROD)

## Environment Variables dengan Pemisahan DEV/PROD

Sistem sekarang mendukung pemisahan environment variables untuk development dan production dengan suffix `_DEV` dan `_PROD`.

### Variables yang Didukung

- `DATABASE_URL_DEV` / `DATABASE_URL_PROD`
- `NEXT_PUBLIC_APP_URL_DEV` / `NEXT_PUBLIC_APP_URL_PROD`
- Dan semua variable lain yang menggunakan helper `getEnv()`

---

## DEV vs PROD Database

Aplikasi sekarang mendukung pemisahan database untuk development dan production.

### Environment Variables

#### Development (NODE_ENV !== "production")
```env
# Database Development
DATABASE_URL_DEV="mysql://username_dev:password_dev@localhost:3306/eltravelin_dev"

# atau dengan parameter tambahan
DATABASE_URL_DEV="mysql://dev_user:dev_pass@localhost:3306/eltravelin_dev?connection_limit=5"
```

#### Production (NODE_ENV === "production")
```env
# Database Production
DATABASE_URL_PROD="mysql://username_prod:password_prod@prod-server:3306/eltravelin_prod"

# atau dengan parameter tambahan
DATABASE_URL_PROD="mysql://prod_user:prod_pass@prod-server:3306/eltravelin_prod?connection_limit=5"
```

#### Fallback (Legacy Support)
```env
# Fallback jika DEV/PROD tidak diset
DATABASE_URL="mysql://user:pass@localhost:3306/eltravelin"
```

### Prioritas Penggunaan

1. **Development Mode** (`npm run dev`):
   - Cari `DATABASE_URL_DEV`
   - Fallback ke `DATABASE_URL`

2. **Production Mode** (`npm run build && npm start`):
   - Cari `DATABASE_URL_PROD`
   - Fallback ke `DATABASE_URL`

### Contoh Setup

#### .env.local untuk Development
```env
# Database Development
DATABASE_URL_DEV="mysql://root:password@localhost:3306/eltravelin_dev"

# API Keys (tetap sama)
MOOTA_WEBHOOK_SECRET="your-secret"
MOOTA_SANDBOX_MODE="true"
```

#### Environment Variables Production (Vercel/Server)
```env
# Set di dashboard Vercel / server
NODE_ENV="production"
DATABASE_URL_PROD="mysql://prod_user:secure_pass@db.example.com:3306/eltravelin_prod"
MOOTA_WEBHOOK_SECRET="prod-secret"
MOOTA_SANDBOX_MODE="false"
```

### Struktur Database yang Disarankan

#### Development
- **Database**: `eltravelin_dev`
- **Username**: `dev_user` (dengan limited privileges)
- **Password**: `dev_password`
- **Host**: `localhost`

#### Production
- **Database**: `eltravelin_prod`
- **Username**: `prod_user` (dengan restricted access)
- **Password**: `strong_random_password`
- **Host**: `db.yourhosting.com` atau internal network

---

## DEV vs PROD App URL

### NEXT_PUBLIC_APP_URL

Untuk URL aplikasi yang berbeda di development dan production:

#### Development (`.env.local`)
```env
NEXT_PUBLIC_APP_URL_DEV="https://development.eltravel.in"
# atau
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Production (Environment Variables)
```env
NEXT_PUBLIC_APP_URL_PROD="https://eltravel.in"
# atau
NEXT_PUBLIC_APP_URL="https://www.eltravel.in"
```

### Penggunaan di Kode

Gunakan helper dari `@/lib/env`:

```typescript
import { getAppUrl } from "@/lib/env";

// Returns appropriate URL based on NODE_ENV
const appUrl = getAppUrl(); // https://development.eltravel.in (dev) atau https://eltravel.in (prod)
```

> ⚠️ **Catatan Penting:** `NEXT_PUBLIC_*` variables hanya work untuk **Server Components/Actions**. Untuk Client Components, Next.js substitute value saat build time, jadi DEV/PROD switching tidak akan berjalan runtime. Pastikan `getAppUrl()` hanya dipakai di server-side code.

### Testing Koneksi

```bash
# Development mode (default)
npm run dev

# Production mode simulation
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

### Troubleshooting

**Error: Database URL not found**
- Pastikan `DATABASE_URL_DEV` atau `DATABASE_URL` sudah diset di `.env.local`

**Error: Access denied**
- Cek username/password
- Pastikan user memiliki privilege untuk database yang dituju

**Error: Unknown database**
- Database belum dibuat, jalankan `npx prisma migrate dev` atau `npx prisma db push`

---

## File yang Sudah Terupdate

Berikut file yang sudah menggunakan helper `getEnv()` untuk support DEV/PROD:

| File | Variable yang Dipakai |
|------|------------------------|
| `lib/prisma.ts` | `DATABASE_URL` |
| `prisma.config.ts` | `DATABASE_URL` |
| `app/actions/trigger-cron.ts` | `NEXT_PUBLIC_APP_URL` |
| `lib/whatsapp.ts` | `NEXT_PUBLIC_APP_URL` |
| `lib/midtrans.ts` | `MIDTRANS_IS_PRODUCTION`, `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` |

Untuk menambahkan support DEV/PROD di file lain, gunakan:

```typescript
import { getEnv, getAppUrl, isProd } from "@/lib/env";

// Pilih salah satu:
const dbUrl = getEnv("DATABASE_URL");              // DATABASE_URL_DEV / DATABASE_URL_PROD
const appUrl = getAppUrl();                        // NEXT_PUBLIC_APP_URL_DEV / NEXT_PUBLIC_APP_URL_PROD
const prod = isProd();                             // true jika NODE_ENV === "production"
```

---

## Prisma Migrate (DEV vs PROD)

Project memakai **Prisma Migrate** (bukan `db push`) setelah baseline `0_init`.

### Workflow

1. Ubah `prisma/schema.prisma`
2. Di local (DEV):

```bash
npm run db:migrate
# sama dengan: prisma migrate dev --name deskripsi_perubahan
```

3. Commit folder `prisma/migrations/`
4. Apply ke production:

```bash
npm run db:deploy:prod
# sama dengan: NODE_ENV=production prisma migrate deploy
```

### Status

```bash
npm run db:status        # DEV
npm run db:status:prod   # PROD
```

> Jangan jalankan ulang `0_init` ke DB yang sudah ada. Baseline sudah di-mark applied di DEV (`u5971811_eltravelin`) dan PROD (`u5971811_eltravelin_prod`).
