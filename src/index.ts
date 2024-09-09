import { Hono } from "hono"
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client/web"
import * as schema from "./database"
import { initializeLucia } from "./lucia"
import { Lucia, Session, User } from "lucia"
import { authRoute, setUserSession } from "./auth"
import { HTTPException } from "hono/http-exception"
import { userRoute } from "./user"

type Bindings = {
	//DATABASE_URL: string;
	//DATABASE_AUTH_TOKEN: string;
	//GH_CLIENT_ID: string;
	//GH_CLIENT_SECRET: string;
	//ENV: string;

	//API_RATELIMITER: RateLimit;
}

type Variables = {
	db: LibSQLDatabase<typeof schema>;
	lucia: Lucia;

	user: User | null;
	session: Session | null;
}

export type C = {
	Bindings: Bindings;
	Variables: Variables;
}

const app = new Hono<C>()

app.onError(async (err, c) => {
	if (err instanceof HTTPException) {
		if (err.status >= 500) {
			console.log(JSON.stringify({ message: err.message, status: err.status }))
		}
		return c.json({ message: err.message }, err.status)
	}
	return c.json({ message: err.message }, 500)
})

app.use(async (c, next) => {
	//const { success } = await c.env.API_RATELIMITER.limit({ key: c.req.path })
	//if (!success) {
	//	throw new HTTPException(429, { message: `rate limit hit for path ${c.req.path}` })
	//}
	const dbClient = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
	const db = drizzle(dbClient, { schema })
	const lucia = initializeLucia(dbClient, c)

	c.set("db", db)
	c.set("lucia", lucia)

	return await next()
})

app.use(setUserSession)

app.route("/auth", authRoute)
app.route("/user", userRoute)

app.get("/", async (c) => {
	return c.json({
		text: "waifu.dev",
	})
})

const port = parseInt(process.env.PORT!) || 3001
console.log(`Running at http://localhost:${port}`)

export default {
	port,
	fetch: app.fetch,
}
