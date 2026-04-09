import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    // eslint-disable-next-line node/prefer-global/process
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    // eslint-disable-next-line node/prefer-global/process
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    // eslint-disable-next-line node/prefer-global/process
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
