# Plan: Harga Titik Singgah Non-Aktif Tetap Dihitung di Kalkulasi Harga

## Tujuan

Titik singgah dengan `isActive = false` (disembunyikan via "Sembunyikan Titik" di Kelola Titik Singgah) harus **tetap menyumbang harganya** pada kalkulasi harga segment untuk customer. Saat ini titik non-aktif justru di-skip dari perhitungan, sehingga harga segment lebih murah dari yang seharusnya.

Perilaku yang diinginkan (dikonfirmasi user):
- Titik `isActive=false` **sembunyi total** dari customer: tidak bisa dipilih sebagai Titik Naik/Turun, dan tidak tampil di timeline "Detail Perjalanan".
- Harga titik non-aktif tetap dijumlahkan pada harga segment antara dua titik aktif.

## Konteks (kondisi saat ini)

`isActive` digunakan di dua tempat per rute di kalkulasi harga:
1. **Memfilter mana titik yang "valid"** sebagai Titik Naik/Turun (customer tidak boleh pilih titik hidden) — **harus tetap aktif-only**.
2. **Memfilter titik yang harga-nya dijumlahkan** untuk harga segment — **harus diubah ke semua titik (non-deleted)**.

Masalah: kode saat ini memakai satu array hasil filter `isActive !== false` untuk kedua tujuan, sehingga harga titik hidden tidak ikut dihitung.

Kode yang dipakai sekarang (commit `7a967b1`): `route.stops.filter((s) => s.isActive !== false)` lalu `.findIndex(...)` + `.slice().reduce(...)`.

## Perubahan

### 1. `app/actions/booking.ts` — `getSchedulesWithStops` (pencarian harga segment)

`app/actions/booking.ts:275-284`:

```
const activeStops = route.stops.filter((s: any) => s.isActive !== false);
```

- Pertahankan `activeStops` untuk mencari `originIndex`/`destIndex` (hanya titik aktif yang boleh dipilih).
- Untuk penjumlahan harga segment, gunakan array **penuh** (semua `isDeleted: false`), bukan `activeStops`:

```ts
const allStops = route.stops; // sudah difilter isDeleted:false di Prisma include
...
let segmentPrice = 0;
for (let i = originIndex + 1; i <= destIndex && i < allStops.length; i++) {
  segmentPrice += allStops[i].price || 0;
}
```

Catatan: karena `originIndex`/`destIndex` adalah index di `activeStops`, dan `allStops` berisi subset aktif ditambah titik hidden di antaranya, mapping index perlu konsisten. Dua opsi:
- (A) Hitung index di `allStops` berdasarkan `id`/`name` dari stop aktif, lalu jumlahkan harga dari semua stop di antara (recommended, paling mudah diverifikasi).

```ts
const origin = activeStops.find(s => s.name.toLowerCase().includes(originStop.toLowerCase()));
const dest = activeStops.find(s => s.name.toLowerCase().includes(destStop.toLowerCase()));
const originIdx = origin ? allStops.findIndex(s => s.id === origin.id) : -1;
const destIdx = dest ? allStops.findIndex(s => s.id === dest.id) : -1;
let segmentPrice = 0;
for (let i = originIdx + 1; i <= destIdx && i < allStops.length; i++) {
  segmentPrice += allStops[i].price || 0;
}
```

- `originStopId`/`destinationStopId`/`originStopSequence`/`destStopSequence` tetap dari stop aktif (`activeStops[originIndex]` / `activeStops[destIndex]`).

### 2. `app/actions/booking.ts` — `createBooking` (verifikasi harga di backend)

`app/actions/booking.ts:410-427` — saat `originStopName`/`destinationStopName` atau `originStopId`/`destinationStopId` diberikan:

- `activeStops` tetap dipakai untuk mencari index origin/dest (validasi: hanya titik aktif yang valid).
- Untuk harga segment, jumlahkan dari `schedule.route.stops` (penuh) antara index stop aktif yang sudah di-resolve:

```ts
const originIdxAll = schedule.route.stops.findIndex((s: any) => s.id === resolvedOriginStopId);
const destIdxAll = schedule.route.stops.findIndex((s: any) => s.id === resolvedDestinationStopId);
pricePerSeat = schedule.route.stops
  .slice(originIdxAll + 1, destIdxAll + 1)
  .reduce((sum: number, stop: any) => sum + (stop.price || 0), 0);
```

(Atau bentuk loop eksplisit agar sama dengan #1.)

### 3. `app/actions/booking.ts` — `adminCreateBooking` (booking manual)

`app/actions/booking.ts:617-626` — sama: pencarian index tetap pakai `activeStops`, harga dijumlahkan dari semua stop:

```ts
const allStops = schedule.route.stops;
const originIdx = allStops.findIndex((s: any) => s.id === data.originStopId);
const destIdx = allStops.findIndex((s: any) => s.id === data.destinationStopId);
if (originIdx !== -1 && destIdx > originIdx) {
  pricePerSeat = allStops
    .slice(originIdx + 1, destIdx + 1)
    .reduce((sum: number, s: any) => sum + (s.price || 0), 0);
}
```

### 4. `components/admin/ManualBookingModal.tsx` — preview harga segment (admin)

`ManualBookingModal.tsx:70-83` — `activeStops` masih benar untuk dropdown pilihan Titik Naik/Turun. Untuk `segmentPrice` preview dan option harga tujuan, jumlahkan harga dari **semua** stop:

- `segmentPrice` (baris 75-83): resolve index origin/dest di `stops` penuh, jumlahkan `stops.slice(...)`.
- Option harga di `Titik Turun` dropdown (baris 251-253): gunakan logika sama.
- Pastikan tetap `activeStops` untuk pilihan yang bisa dipilih (baris 231, 245).

### 5. `components/ScheduleCard.tsx` — timeline "Detail Perjalanan"

`ScheduleCard.tsx:80` `activeStops` sudah benar untuk:
- mencari `originStop`/`destStop` (hanya aktif yang tampil).
- `stopsInSegment` → timeline hanya menampilkan titik aktif (baris 184-189). **Tidak diubah.** Hidden stop tidak tampil di timeline customer (sesuai keputusan).

Perlu dicek: apakah `segmentPrice` yang dikirim ke ScheduleCard dari `getSchedulesWithStops` sudah memakai logika baru (#1) — ya, karena di-pass lewat `d.segmentPrice` di `app/search/page.tsx:104`.

### 6. `app/admin/(protected)/master/stops/page.tsx` — preview harga admin "Kelola Titik"

`stops/page.tsx:23` `activeStops` dipakai untuk tabel preview harga. Ini **admin-only** dan menampilkan harga dari titik yang terlihat di timeline. Karena titik hidden tidak muncul di timeline, tabel preview (berbasis `activeStops`) sudah konsisten — harga segment admin untuk pasangan titik aktif harus mencocokkan yang customer lihat. **Tidak diubah** (opsional: tambahkan catatan jika ingin menampilkan kontribusi harga hidden).

### 7. `app/admin/(protected)/master/new-template/page.tsx` & `edit-template/page.tsx` — harga default template

`new-template/page.tsx:31-33` dan `edit-template/page.tsx:35-37` menjumlahkan harga stop untuk auto-fill harga template. Ini **default harga penuh rute**. Biarkan tetap aktif-only untuk konsistensi (harga template = harga per seat penuh dari titik aktif pertama ke terakhir). **Tidak diubah** kecuali memang ingin mengikutkan harga hidden — di luar scope.

## Yang TIDAK diubah

- `isActive` sebagai penentu validasi Titik Naik/Turun tetap aktif-only (customer tidak boleh pilih titik hidden).
- Filter `isDeleted: false` pada semua Prisma include untuk `stops` tetap.
- `SearchHero.tsx` — hanya menampilkan titik aktif di dropdown customer (tetap).
- Timeline `ScheduleCard.tsx` — hanya titik aktif (tetap).
- `updateRouteStopStatus` — tetap bekerja seperti sekarang.

## Skenario Verifikasi (manual + tipe)

Skenario: rute A→D dengan titik B(seq2, price 10, `isActive=false`), C(seq3, price 20, aktif). Customer cari A→C.

- Harga segment harus = 10 + 20 = 30 (bukan 20 seperti sekarang).
- Titik B **tidak** muncul di dropdown Titik Naik/Turun maupun di timeline.
- Booking jadi via `createBooking`: harga di `BookingSegment.basePrice` = 30.
- Booking manual admin: harga = 30.
- `npx tsc --noEmit` lolos.

Uji regresi:
- Rute dengan semua titik aktif: harga tidak berubah.
- Titik `isDeleted: true` (dihapus): tidak muncul & tidak dihitung.
- Titik hidden sebagai origin/dest tidak bisa dipilih.

## Validasi

1. `npx tsc --noEmit` — tidak ada error.
2. `npm run lint` — tidak ada error baru.
3. Uji manual alur customer (SearchHero → search → seat-selection → checkout → booking) dengan skenario di atas.
4. Uji admin: Manual Booking & preview harga di Kelola Titik.
