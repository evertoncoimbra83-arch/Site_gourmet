import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const guests = mysqlTable("guests", {
  id: varchar("id", { length: 255 }).primaryKey(), // UUID vindo do LocalStorage
  referralCode: varchar("referral_code", { length: 50 }),
  convertedUserId: varchar("converted_user_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow().onUpdateNow(),
});