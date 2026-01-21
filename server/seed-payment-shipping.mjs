import { seedPaymentMethods } from "./payment-methods.ts";
import { seedShippingZones } from "./shipping.ts";

console.log("🌱 Seeding payment methods and shipping zones...");

await seedPaymentMethods();
await seedShippingZones();

console.log("✅ Seed completed!");
process.exit(0);
