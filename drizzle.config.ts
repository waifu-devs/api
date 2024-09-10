import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

export default defineConfig({
	schema: "./src/database.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	verbose: true
})
