import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import { syncSchedulesFromTemplates } from "../lib/schedule-generator";
import bcrypt from 'bcryptjs';

// Setup adapter for seeder
const connectionString = process.env.DIRECT_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 0. Create Admin Account
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  await prisma.admin.upsert({
    where: { email: 'admin@eltravelin.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@eltravelin.com',
      passwordHash: hashedPassword,
      name: 'Super Admin',
    },
  });
  console.log('Admin account created: admin@eltravelin.com / admin123');

  // 1. Create Routes
  const r1 = await prisma.route.upsert({
    where: { origin_destination: { origin: 'Pematangsiantar', destination: 'Kualanamu (Airport)' } },
    update: {},
    create: { origin: 'Pematangsiantar', destination: 'Kualanamu (Airport)' },
  });

  const r2 = await prisma.route.upsert({
    where: { origin_destination: { origin: 'Pematangsiantar', destination: 'Medan' } },
    update: {},
    create: { origin: 'Pematangsiantar', destination: 'Medan' },
  });

  const r3 = await prisma.route.upsert({
    where: { origin_destination: { origin: 'Kualanamu', destination: 'Pematangsiantar' } },
    update: {},
    create: { origin: 'Kualanamu', destination: 'Pematangsiantar' },
  });

  const r4 = await prisma.route.upsert({
    where: { origin_destination: { origin: 'Medan', destination: 'Pematangsiantar' } },
    update: {},
    create: { origin: 'Medan', destination: 'Pematangsiantar' },
  });

  // 2. Clear existing templates & schedules
  // This is safe for dev seeding
  await prisma.seat.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.scheduleTemplate.deleteMany({});

  const routes = [r1, r2, r3, r4];
  const times = ['08:00', '10:00', '13:00', '16:00', '19:00'];

  // 3. Create Templates for each route and time
  console.log('Creating schedule templates...');
  for (const route of routes) {
    for (const time of times) {
      await prisma.scheduleTemplate.create({
        data: {
          routeId: route.id,
          departureTime: time,
          price: 65000,
          vehicleType: 'Hiace Premio Executive',
          capacity: 11,
          isActive: true,
        },
      });
    }
  }

  // 4. Generate actual schedules for the next 30 days
  await syncSchedulesFromTemplates(prisma, 30);

  console.log('Seeding and generation completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
