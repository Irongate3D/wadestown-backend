import { createWorkflow } from "@medusajs/workflows-sdk";
import { createStockLocationsWorkflow } from "@medusajs/medusa/dist/core-flows";

export const createStockLocationWorkflow = createWorkflow(
  "create-stock-location-workflow",
  async (input, { container }) => {
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
);
