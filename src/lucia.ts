import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import { Lucia } from "lucia"
import { Context } from "hono"
import { C } from "."
import { API_DOMAIN } from "./auth"
import { sessions, users } from "./database"


export function initializeLucia(ctx: Context<C>) {
	const drizzle = ctx.get("db")
	const adapter = new DrizzlePostgreSQLAdapter(drizzle, sessions, users)
	const lucia = new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: process.env.NODE_ENV === "production",
				domain: API_DOMAIN(ctx)
			}
		},
		getUserAttributes(databaseUserAttributes) {
			return {
				githubId: databaseUserAttributes.github_id,
				githubUsername: databaseUserAttributes.github_username
			}
		},
	})
	return lucia
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>,
		DatabaseUserAttributes: {
			github_id: number | null;
			github_username: string | null;
		}
	}
}
