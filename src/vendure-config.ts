import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    VendureConfig,
    DefaultSearchPlugin
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { HardenPlugin } from '@vendure/harden-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import { StripePlugin } from '@vendure/payments-plugin/package/stripe';
import 'dotenv/config';
import path from 'path';


const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

export const config: VendureConfig = {
    apiOptions: {
        port: +(process.env.PORT || 3000),
        adminApiPath: 'admin-api',
        cors: {
            origin: process.env.APP_ENV === 'dev'
                ? 'http://localhost:3000'
                : 'https://www.wadestown.co.nz',
            credentials: true  // Required if using cookies/sessions
            },
        shopApiPath: 'shop-api',
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {},
    plugins: [
          // Development-only plugins
        ...(IS_DEV ? [
            GraphiqlPlugin.init()
        ] : []),
        
        // Core production plugins
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: IS_DEV ? undefined : 'https://www.wadestown.co.nz/assets'
        }),
        // Other core plugins
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin,
        
        EmailPlugin.init({
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            transport: {
                type: 'smtp',
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASSWORD,
                },
                logging: IS_DEV,
                debug: IS_DEV,
            },                
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation.
                // Here we are assuming a storefront running at http://localhost:8080.
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://www.wadestown.co.nz/verify',
                passwordResetUrl: 'http://www.wadestown.co.nz/password-reset',
                changeEmailAddressUrl: 'http://www.wadestown.co.nz/verify-email-address-change'
            },
        }),
        // Payment plugins
        StripePlugin.init({
            storeCustomersInStripe: true,
        }),
        // Security plugin (auto-tightens in production)
        HardenPlugin.init({
            maxQueryComplexity: 650,
            logComplexityScore: IS_DEV,  // Only log in development
            apiMode: IS_DEV ? 'dev' : 'prod',  // Auto-switches
        }),
        // Admin UI (ensure port doesn't conflict)
        AdminUiPlugin.init({
            route: 'admin',
            port: serverPort,
            adminUiConfig: {
                apiPort: serverPort,
            },
        }),
    ],
};
