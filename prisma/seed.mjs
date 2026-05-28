import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log("Connected. Seeding...");

// Clear
await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
for (const t of ["Seat","Booking","Passenger","Schedule","ScheduleTemplate","RouteStop","Route","Vehicle","Admin","Banner","PromoCode","OperatingTrip"]) {
  await conn.execute(`TRUNCATE TABLE \`${t}\``);
}
await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
console.log("Cleared.");

// Admin
const hash = await bcrypt.hash("admin123", 10);
await conn.execute(
  "INSERT INTO Admin (id,email,passwordHash,name,createdAt,updatedAt) VALUES (?,?,?,?,NOW(),NOW())",
  [randomUUID(), "admin@eltravelin.com", hash, "Super Admin"]
);
console.log("Admin seeded.");

// Vehicle
const vehicleId = randomUUID();
await conn.execute(
  "INSERT INTO Vehicle (id,plateNumber,name,capacity,isActive,createdAt,updatedAt) VALUES (?,?,?,?,1,NOW(),NOW())",
  [vehicleId, "D 1234 EL", "Farizon SV (Supervan)", 15]
);

// Routes
const routes = [
  { origin: "Bandung (Ahmad Yani/Cicadas)", destination: "Jakarta (Kuningan)", price: 175000 },
  { origin: "Jakarta (Kuningan)", destination: "Bandung (Ahmad Yani/Cicadas)", price: 175000 },
  { origin: "Bandung (Ahmad Yani/Cicadas)", destination: "Soekarno Hatta (Airport)", price: 200000 },
];
for (const r of routes) {
  const id = randomUUID();
  r.id = id;
  await conn.execute(
    "INSERT INTO Route (id,origin,destination,isDeleted,createdAt,updatedAt) VALUES (?,?,?,0,NOW(),NOW())",
    [id, r.origin, r.destination]
  );
}
console.log("Routes seeded.");

// ScheduleTemplates
for (const r of routes) {
  await conn.execute(
    "INSERT INTO ScheduleTemplate (id,routeId,departureTime,arrivalTime,price,vehicleId,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,?,1,NOW(),NOW())",
    [randomUUID(), r.id, "08:00", "11:00", r.price, vehicleId]
  );
}
console.log("Templates seeded.");

// Banners
const banners = [
  { title: "Promo Lebaran", subtitle: "Diskon 20% semua rute", imageUrl: "/banners/banner-1.jpg", promoCode: "LEBARAN20" },
  { title: "Armada Baru", subtitle: "Nikmati Farizon SV terbaru", imageUrl: "/banners/banner-2.jpg", promoCode: null },
  { title: "Early Bird", subtitle: "Pesan 7 hari lebih awal, hemat 15%", imageUrl: "/banners/banner-3.jpg", promoCode: "EARLYBIRD" },
];
for (const b of banners) {
  await conn.execute(
    "INSERT INTO Banner (id,title,subtitle,imageUrl,promoCode,isActive,createdAt,updatedAt) VALUES (?,?,?,?,?,1,NOW(),NOW())",
    [randomUUID(), b.title, b.subtitle, b.imageUrl, b.promoCode]
  );
}
console.log("Banners seeded.");

await conn.end();
console.log("Seeding successful!");

