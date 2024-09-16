import { Hono } from "hono"
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1"
import * as schema from "./database"
import { initializeLucia } from "./lucia"
import { Lucia, Session, User } from "lucia"
import { authRoute, setUserSession } from "./auth"
import { HTTPException } from "hono/http-exception"
import { userRoute } from "./user"
import { logger } from "hono/logger"

type Bindings = Env & {
	API_RATELIMITER: RateLimit;
}

type Variables = {
	db: DrizzleD1Database<typeof schema>;
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
	console.error(err)
	//@ts-expect-error
	if (err.query) {
		//@ts-expect-error
		console.error(err.query)
	}
	if (err instanceof HTTPException) {
		if (err.status >= 500) {
			console.log(JSON.stringify({ message: err.message, status: err.status }))
		}
		return c.json({ message: err.message }, err.status)
	}
	return c.json({ message: err.message }, 500)
})

app.use(logger())

app.use(async (c, next) => {
	const db = drizzle(c.env.DB, { schema })
	const lucia = initializeLucia(c, db)

	c.set("db", db)
	c.set("lucia", lucia)

	return await next()
})

app.use(setUserSession)

app.use(async (c, next) => {
	const user = c.get("user")

	const ratelimitKey = user?.id ?? c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")

	if (!ratelimitKey) {
		throw new HTTPException(429, { message: `rate limit hit, could not get key` })
	}

	const { success } = await c.env.API_RATELIMITER.limit({ key: ratelimitKey })
	if (!success) {
		throw new HTTPException(429, { message: `rate limit hit for key ${ratelimitKey}` })
	}

	return await next()
})

app.route("/auth", authRoute)
app.route("/user", userRoute)

app.get("/", async (c) => {
	return c.json({
		text: "waifu.dev",
	})
})

export default app
