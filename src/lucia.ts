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
		DatabaseUserAttributes: Omit<User, "id">
	}
}
