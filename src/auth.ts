import { Context, Hono, Next } from "hono"
import { C } from "."
import { generateState, GitHub } from "arctic"
import { setCookie, getCookie } from "hono/cookie"
import { HTTPException } from "hono/http-exception"
import { users } from "./database"
import { eq } from "drizzle-orm"
import { monotonicFactory } from "ulidx"

const ulid = monotonicFactory()

const WEB_AUTH_BASE_URL = (c: Context<C>) => c.env.ENV === "production" ? "https://www.waifu.dev/auth" : "http://localhost:3000/auth"
export const API_DOMAIN = (c: Context<C>) => c.env.ENV === "production" ? "waifu.dev" : "localhost"
const GH_OAUTH_STATE_COOKIE = "github_oauth_state"

const app = new Hono<C, {}, "/auth">()

function github(c: Context<C>) {
	return new GitHub(c.env.GH_CLIENT_ID, c.env.GH_CLIENT_SECRET)
}

export async function setUserSession(c: Context<C>, next: Next) {
	const lucia = c.get("lucia")
	const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "")
	if (!sessionId) {
		c.set("user", null)
		c.set("session", null)
		return await next()
	}
	const { session, user } = await lucia.validateSession(sessionId)
	if (session && session.fresh) {
		const sessCookie = lucia.createSessionCookie(session.id)
		setCookie(c, sessCookie.name, sessCookie.value, sessCookie.attributes)
	}
	if (!session) {
		const sessCookie = lucia.createBlankSessionCookie()
		setCookie(c, sessCookie.name, sessCookie.value, sessCookie.attributes)
	}

	c.set("user", user)
	c.set("session", session)

	return await next()
}

export async function isSignedIn(c: Context<C>, next: Next) {
	if (!c.get("user")) {
		throw new HTTPException(401, { message: "not signed in" })
	}
	return await next()
}

app.get("/github", async (c) => {
	const gh = github(c)
	const state = generateState()
	const url = await gh.createAuthorizationURL(state)
	setCookie(c, GH_OAUTH_STATE_COOKIE, state, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "Lax",
		domain: API_DOMAIN(c)
	})
	return c.redirect(url.toString(), 303)
})

app.get("/github/callback", async (c) => {
	const code = c.req.query("code")?.toString() ?? null
	const state = c.req.query("state")?.toString() ?? null
	const storedState = getCookie(c)[GH_OAUTH_STATE_COOKIE] ?? null
	if (!code || !state || !storedState || state !== storedState) {
		throw new HTTPException(400, { message: "missing either code, state or non-matching states" })
	}

	const gh = github(c)

	const tokens = await gh.validateAuthorizationCode(code)
	const githubUserResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokens.accessToken}`,
			"User-Agent": "waifu.dev"
		}
	})
	if (!githubUserResponse.ok) {
		throw new HTTPException(500, { message: "could not hit github api" })
	}
	const githubUser = await githubUserResponse.json() as GithubUser
	const db = c.get("db")
	const existingUser = await db.select().from(users).where(
		eq(users.githubId, +githubUser.id)
	)
	const exUser = existingUser[0]
	const lucia = c.get("lucia")
	if (exUser) {
		const session = await lucia.createSession(exUser.id, {})
		const sessCookie = lucia.createSessionCookie(session.id)
		setCookie(c, sessCookie.name, sessCookie.value, sessCookie.attributes)
		return c.redirect(WEB_AUTH_BASE_URL(c))
	}
	const userId = ulid()
	await db.insert(users).values({
		id: userId,
		githubId: +githubUser.id,
		githubUsername: githubUser.login,
	})
	const session = await lucia.createSession(userId, {})
	const sessCookie = lucia.createSessionCookie(session.id)
	setCookie(c, sessCookie.name, sessCookie.value, sessCookie.attributes)
	return c.redirect(WEB_AUTH_BASE_URL(c))
})

type GithubUser = {
	id: string;
	login: string;
}

export const authRoute = app
