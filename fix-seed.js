const fs = require("fs");
let c = fs.readFileSync("prisma/seed.ts", "utf8");
const newHeader = [
  'import "dotenv/config";',
  'import { PrismaClient } from "@prisma/client";',
  'import { syncSchedulesFromTemplates } from "../lib/schedule-generator";',
  'import bcrypt from "bcryptjs";',
  "",
  "const prisma = new PrismaClient();",
  ""
].join("\n");
const bodyStart = c.indexOf("async function main()");
fs.writeFileSync("prisma/seed.ts", newHeader + "\n" + c.slice(bodyStart));
console.log("done");
