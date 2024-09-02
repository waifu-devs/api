import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";



export const users = sqliteTable("users", {
	id: text("id").primaryKey().notNull(),
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
