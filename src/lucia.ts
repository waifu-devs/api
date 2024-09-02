import { Client } from "@libsql/client/web"
import { LibSQLAdapter } from "@lucia-auth/adapter-sqlite"
import { Lucia } from "lucia"
import { Context } from "hono"
import { C } from "."


export function initializeLucia(client: Client, ctx: Context<C>) {
	const adapter = new LibSQLAdapter(client, {
		user: "users",
		session: "sessions"
	})
	const lucia = new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: ctx.env.ENV === "production"
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
