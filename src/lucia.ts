import { Client } from "@libsql/client/web"
import { LibSQLAdapter } from "@lucia-auth/adapter-sqlite"
import { Lucia } from "lucia"
import { User } from "./database"


export function initializeLucia(client: Client) {
	const adapter = new LibSQLAdapter(client, {
		user: "users",
		session: "sessions"
	})
	const lucia = new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				secure: process.env.NODE_ENV === "production"
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
