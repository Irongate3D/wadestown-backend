import { runCreateStockLocation } from "../workflows/create-stock-location"
import * as path from "path"

// Use CommonJS require to load internal loader
const { createMedusaApp } = require("@medusajs/medusa/dist/loaders")

;(async () => {
  const rootDir = path.resolve(__dirname, "../..")

  const { container } = await createMedusaApp({
    directory: rootDir,
    expressApp: undefined,
    environment: process.env.NODE_ENV || "development",
  })

  const result = await runCreateStockLocation(container)
  console.log("✅ Stock location created:", result)
})()
