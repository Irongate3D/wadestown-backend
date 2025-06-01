import { runCreateStockLocation } from "../workflows/create-stock-location"
import { getContainer } from "@medusajs/utils"
import * as path from "path"

;(async () => {
  const rootDir = path.resolve(__dirname, "../..")

  const container = await getContainer({
    directory: rootDir,
    environment: process.env.NODE_ENV || "development",
  })

  const result = await runCreateStockLocation(container)
  console.log("✅ Stock location created:", result)
})()
