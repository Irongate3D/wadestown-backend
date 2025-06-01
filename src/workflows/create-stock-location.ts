import { createStockLocationsWorkflow } from "@medusajs/core-flows";
import { type AwilixContainer } from "awilix";

export async function runCreateStockLocation(container: AwilixContainer) {
  const result = await createStockLocationsWorkflow.run(
    {
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
    { container }
  );

  return result;
}