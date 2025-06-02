import { createStockLocationsWorkflow } from "@medusajs/core-flows"
import { type MedusaContainer } from "@medusajs/types";

export async function runCreateStockLocation(container: MedusaContainer) {
  const result = await createStockLocationsWorkflow.run({
    input: {
      locations: [
        {
          name: "Main Warehouse",
          address: {
            address_1: "123 Main St",
            city: "Auckland",
            country_code: "NZ",
          },
        },
      ],
    },
    container,
  });

  return result;
}
