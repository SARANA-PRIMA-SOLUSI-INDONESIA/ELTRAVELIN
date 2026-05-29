import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== DB CLEAN-UP PROCESS STARTED ===");
  console.log("Cleaning up tables to get fresh data...");

  // 1. Delete Bookings and related data
  console.log("- Cleaning BookingSegment...");
  await prisma.bookingSegment.deleteMany({});
  
  console.log("- Cleaning Passenger...");
  await prisma.passenger.deleteMany({});
  
  console.log("- Cleaning Seat...");
  await prisma.seat.deleteMany({});
  
  console.log("- Cleaning Booking...");
  await prisma.booking.deleteMany({});

  // 2. Delete Schedules, templates, and trips
  console.log("- Cleaning Schedule...");
  await prisma.schedule.deleteMany({});
  
  console.log("- Cleaning ScheduleTemplate...");
  await prisma.scheduleTemplate.deleteMany({});
  
  console.log("- Cleaning OperatingTrip...");
  await prisma.operatingTrip.deleteMany({});

  // 3. Delete Route stops and Routes
  console.log("- Cleaning RouteStop...");
  await prisma.routeStop.deleteMany({});
  
  console.log("- Cleaning Route...");
  await prisma.route.deleteMany({});

  console.log("=== DB CLEAN-UP COMPLETED SUCCESSFULY ===");
  console.log("All routes, schedules, templates, and bookings have been completely emptied.");
}

main()
  .catch((e) => {
    console.error("Clean-up error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
