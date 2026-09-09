import dotenv from "dotenv";
dotenv.config();

import { runSubscriptionEngineTests } from "../src/tests/SubscriptionEngine.test.ts";

runSubscriptionEngineTests().then(() => {
  console.log("Subscription tests completed successfully!");
  process.exit(0);
}).catch((e) => {
  console.error("Subscription tests failed:", e);
  process.exit(1);
});
