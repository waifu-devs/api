import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config({ path: ".dev.vars" })

if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
	throw new Error("MISSING DATABASE CREDENTIALS")
}

export default defineConfig({
	schema: "./src/database.ts",
	out: "./drizzle",
	dialect: "sqlite",
	driver: "turso",
	dbCredentials: {
		url: process.env.DATABASE_URL,
		authToken: process.env.DATABASE_AUTH_TOKEN,
	},
	verbose: true
})
