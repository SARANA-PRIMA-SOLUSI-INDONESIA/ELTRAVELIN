import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const url = new URL(process.env.DATABASE_URL_DEV || process.env.DATABASE_URL || "");
const adapter = new PrismaMariaDb({ host: url.hostname, port: Number(url.port) || 3306, user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1) });
const prisma = new PrismaClient({ adapter });
(async () => {
  const drivers = await prisma.driver.findMany({ select: { id: true, name: true, isActive: true, restDayOfWeek: true, _count: { select: { operatingTrips: true } } } });
  console.log("DRIVERS=" + JSON.stringify(drivers));
  const trips = await prisma.schedule.count({ where: { isDeleted: false, operatingTrip: { driverId: { not: null } } } });
  const unassigned = await prisma.schedule.count({ where: { isDeleted: false, operatingTrip: { driverId: null } } });
  console.log("assignedTrips=" + trips + " unassignedTrips=" + unassigned);
  await prisma.$disconnect();
})();