import { seedPaymentMethods } from "./payment-methods.ts";
import { seedShippingZones } from "./shipping.ts";



await seedPaymentMethods();
await seedShippingZones();


// eslint-disable-next-line no-undef
process.exit(0);
