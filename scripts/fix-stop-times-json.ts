import "dotenv/config";
import { prisma } from "../lib/prisma";

async function clearCorrupt(table: "scheduleTemplate" | "schedule") {
  const rows =
    table === "scheduleTemplate"
      ? await prisma.scheduleTemplate.findMany({
          where: { stopTimesJson: { not: null } },
          select: { id: true, stopTimesJson: true },
        })
      : await prisma.schedule.findMany({
          where: { stopTimesJson: { not: null } },
          select: { id: true, stopTimesJson: true },
        });

  let cleared = 0;
  for (const row of rows) {
    if (!row.stopTimesJson) continue;
    try {
      JSON.parse(row.stopTimesJson);
    } catch {
      if (table === "scheduleTemplate") {
        await prisma.scheduleTemplate.update({
          where: { id: row.id },
          data: { stopTimesJson: null },
        });
      } else {
        await prisma.schedule.update({
          where: { id: row.id },
          data: { stopTimesJson: null },
        });
      }
      cleared += 1;
      console.log(`cleared corrupt ${table}`, row.id, "len", row.stopTimesJson.length);
    }
  }
  console.log(`${table}: scanned ${rows.length}, cleared ${cleared}`);
}

async function main() {
  await clearCorrupt("scheduleTemplate");
  await clearCorrupt("schedule");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
