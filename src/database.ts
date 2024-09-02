import { InferSelectModel } from "drizzle-orm";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";



export const users = sqliteTable("users", {
	id: text("id").primaryKey().notNull(),
	githubId: integer("github_id"),
	githubUsername: text("github_username")
}, (table) => {
	return {
		users_github_id_unique: unique("users_github_id_unique").on(table.githubId)
	}
})

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey().notNull(),
	expires_at: integer("expires_at").notNull(),
	user_id: text("user_id").notNull(),
}, (table) => {
	return {
		sessions_user_id_idx: index("sessions_user_id_idx").on(table.user_id)
	}
})

export type User = InferSelectModel<typeof users>
export type Session = InferSelectModel<typeof sessions>
