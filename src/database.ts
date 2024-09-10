import { InferSelectModel } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";



export const users = pgTable("users", {
	id: text("id").primaryKey().notNull(),
	githubId: integer("github_id"),
	githubUsername: text("github_username")
}, (table) => {
	return {
		users_github_id_unique: unique("users_github_id_unique").on(table.githubId)
	}
})

export const sessions = pgTable("sessions", {
	id: text("id").primaryKey().notNull(),
	user_id: text("user_id").notNull(),
	expires_at: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull(),
}, (table) => {
	return {
		sessions_user_id_idx: index("sessions_user_id_idx").on(table.user_id)
	}
})

export type User = InferSelectModel<typeof users>
export type Session = InferSelectModel<typeof sessions>
