import dotenv from "dotenv"
dotenv.config()

/** @type {import("drizzle-kit").Config} */
export default {
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};