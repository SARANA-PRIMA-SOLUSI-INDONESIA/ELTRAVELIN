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
      
      // Create departure in Jakarta time
      const departure = new Date(targetDate);
      departure.setHours(hours, minutes, 0, 0);
      
      // Ensure we are working with the correct absolute time for WIB
      // We can use a helper or string manipulation to force offset
      const isoStr = departure.toISOString().split('T')[0];
      const departureWIB = new Date(`${isoStr}T${template.departureTime}:00+07:00`);

      const arrival = new Date(departureWIB);
      const [arrHours, arrMins] = template.arrivalTime.split(":").map(Number);
      arrival.setHours(arrHours, arrMins, 0, 0);

      // If arrival time is earlier than departure time, it means it arrives the next day
      if (arrival.getTime() < departureWIB.getTime()) {
        arrival.setDate(arrival.getDate() + 1);
      }

      // 1. Check if Schedule already exists
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          templateId: template.id,
          departureTime: departureWIB,
        }
      });

      if (!existingSchedule) {
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
            }
          });
        });
      }
    }
  }
  
  console.log("Schedule sync completed!");
}
