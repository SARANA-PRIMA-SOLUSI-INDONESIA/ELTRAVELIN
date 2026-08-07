import { Prisma, PrismaClient } from "@prisma/client";

export async function syncSchedulesFromTemplates(prismaInstance: PrismaClient, daysAhead: number = 30) {
  const prisma = prismaInstance;
  console.log(`Syncing schedules for the next ${daysAhead} days...`);

  const templates = await prisma.scheduleTemplate.findMany({
    where: { isActive: true },
    include: { route: true }
  });

  if (templates.length === 0) {
    console.log("No active templates found.");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= daysAhead; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dayOfWeek = targetDate.getDay();

    for (const template of templates) {
      if (template.dayOfWeek != null && template.dayOfWeek !== dayOfWeek) {
        continue;
      }

      const [hours, minutes] = template.departureTime.split(":").map(Number);

      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const departureWIB = new Date(`${dateStr}T${template.departureTime}:00+07:00`);

      let arrival = new Date(`${dateStr}T${template.arrivalTime}:00+07:00`);

      if (arrival.getTime() < departureWIB.getTime()) {
        const nextDate = new Date(targetDate);
        nextDate.setDate(targetDate.getDate() + 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextDay = String(nextDate.getDate()).padStart(2, '0');
        const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;
        arrival = new Date(`${nextDateStr}T${template.arrivalTime}:00+07:00`);
      }

      const existingSchedule = await prisma.schedule.findFirst({
        where: { templateId: template.id, departureTime: departureWIB }
      });

      const capacity = template.capacity || 15;
      const vehicleType = template.vehicleId
        ? (await prisma.vehicle.findUnique({ where: { id: template.vehicleId } }))?.name || "Bus"
        : "Bus";

      if (existingSchedule) {
        await prisma.schedule.update({
          where: { id: existingSchedule.id },
          data: { price: template.price, departureTime: departureWIB, arrivalTime: arrival, vehicleType, capacity, stopTimesJson: template.stopTimesJson }
        });
      } else {
        console.log(`Generating schedule for ${template.route.origin} -> ${template.route.destination} on ${departureWIB.toISOString()}`);
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const newTrip = await tx.operatingTrip.create({
            data: { vehicleId: template.vehicleId || null, date: targetDate, status: 'SCHEDULED' }
          });
          const operatingTripId = newTrip.id;

          const seatNumbers = Array.from({ length: capacity }, (_, i) => (i + 1).toString());
          await tx.seat.createMany({
            data: seatNumbers.map((num: string) => ({ operatingTripId, seatNumber: num, status: 'AVAILABLE' })),
          });

          await tx.schedule.create({
            data: { routeId: template.routeId, templateId: template.id, departureTime: departureWIB, arrivalTime: arrival, price: template.price, vehicleType, capacity, operatingTripId, stopTimesJson: template.stopTimesJson }
          });
        });
      }
    }
  }

  console.log("Schedule sync completed!");
}