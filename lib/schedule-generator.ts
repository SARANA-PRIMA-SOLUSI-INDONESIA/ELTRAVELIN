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
    include: { route: true, vehicle: true }
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
      
      // Ensure we are working with the correct absolute time for WIB
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const departureWIB = new Date(`${dateStr}T${template.departureTime}:00+07:00`);

      let arrival = new Date(`${dateStr}T${template.arrivalTime}:00+07:00`);

      // If arrival time is earlier than departure time, it means it arrives the next day
      if (arrival.getTime() < departureWIB.getTime()) {
        const nextDate = new Date(targetDate);
        nextDate.setDate(targetDate.getDate() + 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextDay = String(nextDate.getDate()).padStart(2, '0');
        const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;
        arrival = new Date(`${nextDateStr}T${template.arrivalTime}:00+07:00`);
      }

      // 1. Check if Schedule already exists
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          templateId: template.id,
          departureTime: departureWIB,
        }
      });

      if (existingSchedule) {
        console.log(`Updating existing schedule ${existingSchedule.id} price: ${template.price}`);
        await prisma.schedule.update({
          where: { id: existingSchedule.id },
          data: {
            price: template.price,
            departureTime: departureWIB,
            arrivalTime: arrival,
            vehicleType: template.vehicle.name,
            capacity: template.vehicle.capacity,
            stopTimesJson: template.stopTimesJson,
          }
        });
      } else {
        console.log(`Generating schedule for ${template.route.origin} -> ${template.route.destination} on ${departureWIB.toISOString()}`);
        
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Find existing OperatingTrip for this specific vehicle on this specific date
          const existingTrip = await tx.operatingTrip.findFirst({
            where: {
              vehicleId: template.vehicleId,
              date: targetDate
            }
          });

          let operatingTripId = existingTrip?.id;

          // If no operating trip exists for this vehicle today, create one
          if (!operatingTripId) {
            const newTrip = await tx.operatingTrip.create({
              data: {
                vehicleId: template.vehicleId,
                date: targetDate,
                status: 'SCHEDULED'
              }
            });
            operatingTripId = newTrip.id;

            // Generate Seats for the new physical trip based on vehicle capacity
            const seatNumbers = Array.from({ length: template.vehicle.capacity }, (_, i) => (i + 1).toString());
            await tx.seat.createMany({
              data: seatNumbers.map((num: string) => ({
                operatingTripId: operatingTripId as string,
                seatNumber: num,
                status: 'AVAILABLE',
              })),
            });
          }

          // Create the Marketing Schedule linked to the OperatingTrip
          await tx.schedule.create({
            data: {
              routeId: template.routeId,
              templateId: template.id,
              departureTime: departureWIB,
              arrivalTime: arrival,
              price: template.price,
              vehicleType: template.vehicle.name,
              capacity: template.vehicle.capacity,
              operatingTripId: operatingTripId,
              stopTimesJson: template.stopTimesJson,
            }
          });
        });
      }
    }
  }
  
  console.log("Schedule sync completed!");
}
