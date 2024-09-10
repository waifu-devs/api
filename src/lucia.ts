import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import { Lucia } from "lucia"
import { Context } from "hono"
import { C } from "."
import { API_DOMAIN } from "./auth"
import * as schema from "./database"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"


export function initializeLucia(ctx: Context<C>, drizzle: PostgresJsDatabase<typeof schema>) {
	const adapter = new DrizzlePostgreSQLAdapter(drizzle, schema.sessions, schema.users)
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
