# Plan: Pagination Options + Driver Name Search di Halaman Jadwal Driver

## Tujuan
Di `/admin/driver-schedules`, tambahkan:
1. Pemilih ukuran halaman (page size) dengan opsi **10 / 25 / 50 / 100** (default 50).
2. Input pencarian berdasarkan **nama driver** (server-side, memfilter jadwal yang sudah ditugaskan ke driver tsb).

## Batasan
- Tidak mengubah perilaku halaman lain yang memakai `Pagination` (bookings, drivers, search) — perubahan harus backward-compatible.
- Tidak ada perubahan schema/database. Tidak ada migrasi.
- Halaman tetap read-only (tidak materialize; materialize hanya di `autoAssignDrivers`).

## File yang Diubah

### 1. `components/Pagination.tsx`
- Tambah prop opsional `pageSizeOptions?: number[]`.
- Tambah dropdown "Tampilkan [X] baris" (hanya dirender jika `pageSizeOptions` diberikan & tidak kosong) + info "Menampilkan {start}-{end} dari {total}".
- `changePageSize(size)`: set `pageSize` & reset `page=1` di URL.
- Jika `!hasOptions && totalPages <= 1` → return null (perilaku lama dipertahankan untuk halaman lain).
- Jika ada `pageSizeOptions`, komponen selalu dirender (dropdown terlihat walau 1 halaman).

### 2. `app/admin/(protected)/driver-schedules/page.tsx`
- Constanta: `PAGE_SIZE_OPTIONS = [10, 25, 50, 100]` (gantikan `PAGE_SIZE = 50`).
- Baca dari `searchParams`: `pageSize` (validasi: hanya terima salah satu dari `PAGE_SIZE_OPTIONS`, default 50), `q` (trim).
- Ubah `whereSchedules` menjadi bertipe `Prisma.ScheduleWhereInput`, dan jika `q` tidak kosong tambahkan:
  ```ts
  whereSchedules.operatingTrip = { is: { driver: { name: { contains: q } } } };
  ```
  (relasi terverifikasi di schema: `Schedule.operatingTrip → OperatingTrip.driver → Driver.name`).
- Query utama (`findMany`) & `count` memakai `whereSchedules` (termasuk filter q).
- Query riwayat 7 hari (`priorRows`) TIDAK dipengaruhi filter q — tetap untuk lokasi/istirahat driver.
- Form filter: tambahkan input `<input name="q" type="text" placeholder="Nama driver..." defaultValue={q} />`.
- Render `<Pagination total={total} pageSize={pageSize} currentPage={page} pageSizeOptions={PAGE_SIZE_OPTIONS} />`.

## Perilaku yang Diharapkan
- Dropdown ukuran halaman: 10/25/50/100, default 50, ganti ukuran → reset ke halaman 1.
- Pencarian: ketik nama driver → "Tampilkan" → hanya jadwal yang driver-nya cocok (contains, case-insensitive sesuai DB collation utf8mb4).
- Filter tanggal + ukuran halaman + halaman + q tetap dipertahankan saat navigasi URL.

## Risiko & Catatan
- `Pagination` tanpa `pageSizeOptions` di halaman lain → tetap memakai UI lama (hanya prev/next + nomor), kecuali totalPages ≤ 1 yang tetap return null. Backward-compatible.
- Pencarian "Tampilkan" via GET form menimpa `page` → sudah ada hidden input `page=1`; pastikan tetap ada.
- `Prisma.ScheduleWhereInput` perlu import type dari `@prisma/client`.

## Validasi
1. `npx tsc --noEmit`
2. `npx eslint components/Pagination.tsx "app/admin/(protected)/driver-schedules/page.tsx"`
3. `npm run build`
4. Manual: buka `/admin/driver-schedules` → ubah ukuran halaman → cek URL berisi `pageSize`; ketik nama driver → "Tampilkan" → cek filter bekerja; cek halaman bookings/drivers/search tetap normal.

## Out of Scope
- Menambahkan fitur search ke halaman lain.
- Materialize otomatis saat buka halaman (tetap nonaktif).
- Perubahan skema DB.
