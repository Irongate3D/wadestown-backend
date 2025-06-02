import { loadEnv, defineConfig } from '@medusajs/framework/utils'

// Load environment variables
loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || 'http://localhost:3000',
      adminCors: process.env.ADMIN_CORS || 'http://localhost:7000',
      authCors: process.env.AUTH_CORS || 'http://localhost:7000',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },

  modules: {
    // ✅ Inventory module (includes stock locations)
    inventory: {
      resolve: '@medusajs/inventory',
      options: {
        database: {
          clientUrl: process.env.DATABASE_URL,
        },
      },
    },
  },
})
