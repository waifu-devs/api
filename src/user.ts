import { Hono } from "hono"
import { C } from "."
import { isSignedIn } from "./auth"


const app = new Hono<C, {}, "/user">()

app.get("/", isSignedIn, async (c) => {
	const user = c.get("user")
	return c.json({ user })
})

export const userRoute = app
