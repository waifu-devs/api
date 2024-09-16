import { defineConfig } from "drizzle-kit"


export default defineConfig({
	schema: "./src/database.ts",
	out: "./drizzle",
	dialect: "sqlite",
	driver: "turso",
	dbCredentials: {
		url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/9f9d42bb952cec24b95a12f0c9848b4a17b358b8e780b6f6b706543c65224df3.sqlite"
	},
	verbose: true
})
