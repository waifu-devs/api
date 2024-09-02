import { Hono } from "hono"
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client/web"
import * as schema from "./database"

type Bindings = {
	DATABASE_URL: string;
	DATABASE_AUTH_TOKEN: string;
}

type Variables = {
	db: LibSQLDatabase<typeof schema>;
}

export type C = {
	Bindings: Bindings;
	Variables: Variables;
}

const app = new Hono<C>()

app.use(async (c, next) => {
	const dbClient = createClient({ url: c.env.DATABASE_URL, authToken: c.env.DATABASE_AUTH_TOKEN })
	const db = drizzle(dbClient, { schema })

	c.set("db", db)

	await next()
})

app.get("/", async (c) => {
	const db = c.get("db")
	const results = await db.select().from(schema.users)
	return c.json({
		text: "Hello Waifu",
		results,
	})
})

export default app
