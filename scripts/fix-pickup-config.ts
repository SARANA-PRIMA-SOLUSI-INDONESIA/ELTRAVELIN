import "dotenv/config";
import { prisma } from "../lib/prisma";
import { DEFAULT_PICKUP_CONFIG, PICKUP_CONFIG_KEY } from "../lib/pickup";

async function main() {
  const row = await prisma.appSetting.findUnique({ where: { key: PICKUP_CONFIG_KEY } });
  if (!row) {
    console.log("no pickupConfig row — nothing to fix");
    return;
  }
  console.log("current length:", row.value.length);
  try {
    JSON.parse(row.value);
    console.log("JSON valid — no fix needed");
    return;
  } catch {
    console.log("corrupt JSON — rewriting DEFAULT_PICKUP_CONFIG");
  }
  await prisma.appSetting.update({
    where: { key: PICKUP_CONFIG_KEY },
    data: { value: JSON.stringify(DEFAULT_PICKUP_CONFIG) },
  });
  console.log("fixed length:", JSON.stringify(DEFAULT_PICKUP_CONFIG).length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
