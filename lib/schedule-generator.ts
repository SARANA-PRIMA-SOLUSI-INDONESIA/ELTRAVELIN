import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Generates daily Schedule and Seat records based on ScheduleTemplate data.
 * @param prismaInstance The prisma client to use.
 * @param daysAhead Number of days into the future to generate schedules for.
 */
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
    
    // For each template, try to generate a schedule for this targetDate
    for (const template of templates) {
      const [hours, minutes] = template.departureTime.split(":").map(Number);
      
      const departure = new Date(targetDate);
      departure.setHours(hours, minutes, 0, 0);
      
      const arrival = new Date(departure);
      // Hardcoded 3.5 hours for now, can be customized in template later
      arrival.setHours(departure.getHours() + 3);
      arrival.setMinutes(departure.getMinutes() + 30);

      // 1. Upsert Schedule
      // We use a findUnique or similar check. 
      // Since we don't have a unique constraint on (templateId, departureTime), 
      // we'll check manually.
      
      const existing = await prisma.schedule.findFirst({
        where: {
          templateId: template.id,
          departureTime: departure,
        }
      });

      if (!existing) {
        console.log(`Generating schedule for ${template.route.origin} -> ${template.route.destination} on ${departure.toISOString()}`);
        
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const schedule = await tx.schedule.create({
            data: {
              routeId: template.routeId,
              templateId: template.id,
              departureTime: departure,
              arrivalTime: arrival,
              price: template.price,
              vehicleType: template.vehicleType,
              capacity: template.capacity,
            }
          });

          // 2. Generate Seats
          const seatNumbers = Array.from({ length: 15 }, (_, i) => (i + 1).toString());
          await tx.seat.createMany({
            data: seatNumbers.map((num: string) => ({
              scheduleId: schedule.id,
              seatNumber: num,
              status: 'AVAILABLE',
            })),
          });
        });
      }
    }
  }
  
  console.log("Schedule sync completed!");
}
