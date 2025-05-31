import { createStockLocationWorkflow } from "../workflows/create-stock-location";
import { getContainer } from "@medusajs/medusa/dist/loaders/container";

(async () => {
  const container = await getContainer();

  const workflow = createStockLocationWorkflow();
  const result = await workflow.run({}, { container });

  console.log("Stock location created:", result);
})();
