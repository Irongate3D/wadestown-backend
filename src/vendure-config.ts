import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    VendureConfig,
    DefaultSearchPlugin,
    AssetStorageStrategy,
    RequestContext,
} from '@vendure/core';
import {
    defaultEmailHandlers,
    EmailPlugin,
    FileBasedTemplateLoader,
} from '@vendure/email-plugin';
import { HardenPlugin } from '@vendure/harden-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DefaultAssetNamingStrategy } from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import { StripePlugin } from '@vendure/payments-plugin/package/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import path from 'path';
import 'dotenv/config';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +(process.env.PORT || 3000);

// ✅ Custom SupabaseAssetStorageStrategy
export class SupabaseAssetStorageStrategy implements AssetStorageStrategy {
    private client: SupabaseClient;
    private bucketName = 'vendure-assets';

    constructor(private supabaseUrl: string, private supabaseKey: string) {
        this.client = createClient(supabaseUrl, supabaseKey);
    }

    async writeFileFromBuffer(fileName: string, data: Buffer): Promise<string> {
        const { error } = await this.client.storage
            .from(this.bucketName)
            .upload(fileName, data, { upsert: true });

        if (error) throw new Error(`Supabase upload failed: ${error.message}`);
        return fileName;
    }

    async writeFileFromStream(fileName: string, stream: Readable): Promise<string> {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        return this.writeFileFromBuffer(fileName, buffer);
    }

    async readFileToBuffer(identifier: string): Promise<Buffer> {
        const { data, error } = await this.client.storage
            .from(this.bucketName)
            .download(identifier);

        if (error || !data) {
            throw new Error(`Supabase download failed: ${error?.message}`);
        }

        return Buffer.from(await data.arrayBuffer());
    }

    async readFileToStream(identifier: string): Promise<Readable> {
        const buffer = await this.readFileToBuffer(identifier);
        return Readable.from(buffer);
    }

    async deleteFile(identifier: string): Promise<void> {
        const { error } = await this.client.storage
            .from(this.bucketName)
            .remove([identifier]);

        if (error) throw new Error(`Supabase delete failed: ${error.message}`);
    }

    async fileExists(fileName: string): Promise<boolean> {
        const { data, error } = await this.client.storage
            .from(this.bucketName)
            .list('', { search: fileName });

        if (error) return false;
        return data?.some(file => file.name === fileName) ?? false;
    }

    toAbsoluteUrl(filePath: string): string {
        return `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;
    }
}

// ✅ Vendure config using Supabase
export const config: VendureConfig = {
    apiOptions: {
        hostname: '0.0.0.0',
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        cors: {
            origin: IS_DEV
                ? 'http://localhost:3000'
                : 'https://wadestown-backend.onrender.com/admin',
            credentials: true,
        },
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {})
    },

    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME!,
            password: process.env.SUPERADMIN_PASSWORD!,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET!,
        },
    },

    dbConnectionOptions: {
        type: 'postgres',
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: IS_DEV,
        database: process.env.DB_NAME!,
        schema: process.env.DB_SCHEMA!,
        host: process.env.DB_HOST!,
        port: +(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
    },

    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },

    customFields: {},

    plugins: [
        ...(IS_DEV ? [GraphiqlPlugin.init()] : []),

        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, 'assets'),
            namingStrategy: new DefaultAssetNamingStrategy(),
            storageStrategyFactory: () =>
                new SupabaseAssetStorageStrategy(
                    process.env.SUPABASE_URL!,
                    process.env.SUPABASE_SECRET_KEY!
                ),
        }),

        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin,

        EmailPlugin.init({
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(
                path.join(__dirname, '../static/email/templates')
            ),
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
                fromAddress: '"Wadestown" <noreply@wadestown.co.nz>',
                verifyEmailAddressUrl: 'https://www.wadestown.co.nz/verify',
                passwordResetUrl: 'https://www.wadestown.co.nz/password-reset',
                changeEmailAddressUrl: 'https://www.wadestown.co.nz/verify-email-address-change',
            },
        }),

        StripePlugin.init({
            storeCustomersInStripe: true,
        }),

        HardenPlugin.init({
            maxQueryComplexity: 650,
            logComplexityScore: IS_DEV,
            apiMode: IS_DEV ? 'dev' : 'prod',
        }),

        AdminUiPlugin.init({
            route: 'admin',
            port: serverPort,
            hostname: '0.0.0.0',
            adminUiConfig: {
                apiPort: serverPort,
            },
        }),
    ],
};
