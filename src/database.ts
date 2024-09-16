import { InferSelectModel } from "drizzle-orm";
import { index, integer, sqliteTable, primaryKey, text, unique } from "drizzle-orm/sqlite-core";



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
	userId: text("user_id").notNull().references(() => users.id),
	expiresAt: integer("expires_at").notNull(),
}, (table) => {
	return {
		sessions_user_id_idx: index("sessions_user_id_idx").on(table.userId)
	}
})


export type User = InferSelectModel<typeof users>
export type Session = InferSelectModel<typeof sessions>
