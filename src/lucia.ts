import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle"
import { Lucia } from "lucia"
import { Context } from "hono"
import { C } from "."
import { API_DOMAIN } from "./auth"
import * as schema from "./database"
import { DrizzleD1Database } from "drizzle-orm/d1"


export function initializeLucia(ctx: Context<C>, drizzle: DrizzleD1Database<typeof schema>) {
	const adapter = new DrizzleSQLiteAdapter(drizzle, schema.sessions, schema.users)
	const lucia = new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: ctx.env.ENV === "production",
				domain: API_DOMAIN(ctx)
			}
		},
		getUserAttributes(databaseUserAttributes) {
			return {
				githubId: databaseUserAttributes.githubId,
				githubUsername: databaseUserAttributes.githubUsername
			}
		},
	})
	return lucia
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>,
		DatabaseUserAttributes: schema.User
	}
}
