// @ts-ignore
const midtransClient = require('midtrans-client');
import { getEnv, isProd } from "./env";

export const snap = new midtransClient.Snap({
  isProduction: getEnv("MIDTRANS_IS_PRODUCTION") === 'true' || isProd(),
  serverKey: getEnv("MIDTRANS_SERVER_KEY"),
  clientKey: getEnv("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY")
});
