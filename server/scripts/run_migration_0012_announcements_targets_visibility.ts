import { sql, type SQL } from "drizzle-orm";

import { getDb } from "../db.js";

type Db = Awaited<ReturnType<typeof getDb>>;

function extractRows(result: unknown): unknown[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown[] }).rows)
  ) {
    return (result as { rows: unknown[] }).rows;
  }

  return [];
}

async function columnExists(
  db: Db,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 AS found
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
      AND COLUMN_NAME = ${columnName}
    LIMIT 1
  `);

  return extractRows(result).length > 0;
}

async function indexExists(
  db: Db,
  tableName: string,
  indexName: string,
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 AS found
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
      AND INDEX_NAME = ${indexName}
    LIMIT 1
  `);

  return extractRows(result).length > 0;
}

async function addColumnIfMissing(
  db: Db,
  tableName: string,
  columnName: string,
  ddl: SQL,
): Promise<void> {
  if (await columnExists(db, tableName, columnName)) {
    console.log(`Skipping ${tableName}.${columnName}: column already exists.`);
    return;
  }

  console.log(`Adding ${tableName}.${columnName}...`);
  await db.execute(ddl);
}

async function createIndexIfMissing(
  db: Db,
  tableName: string,
  indexName: string,
  ddl: SQL,
): Promise<void> {
  if (await indexExists(db, tableName, indexName)) {
    console.log(`Skipping ${tableName}.${indexName}: index already exists.`);
    return;
  }

  console.log(`Creating ${tableName}.${indexName}...`);
  await db.execute(ddl);
}

async function runMigration(): Promise<void> {
  const db = await getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS \`announcements\` (
      \`id\` varchar(255) NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`content\` text NOT NULL,
      \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
      \`start_date\` timestamp NULL DEFAULT NULL,
      \`end_date\` timestamp NULL DEFAULT NULL,
      \`type\` enum('INFO','PROMO','NEWS','DELIVERY','SYSTEM') NOT NULL DEFAULT 'INFO',
      \`icon_emoji\` varchar(16) NULL DEFAULT NULL,
      \`visibility_scope\` enum('all','authenticated','specific_users') NOT NULL DEFAULT 'all',
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    )
  `);

  await addColumnIfMissing(
    db,
    "announcements",
    "icon_emoji",
    sql`ALTER TABLE \`announcements\` ADD COLUMN \`icon_emoji\` varchar(16) NULL DEFAULT NULL AFTER \`type\``,
  );

  await addColumnIfMissing(
    db,
    "announcements",
    "visibility_scope",
    sql`ALTER TABLE \`announcements\` ADD COLUMN \`visibility_scope\` enum('all','authenticated','specific_users') NOT NULL DEFAULT 'all' AFTER \`icon_emoji\``,
  );

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS \`announcement_targets\` (
      \`id\` varchar(255) NOT NULL,
      \`announcement_id\` varchar(255) NOT NULL,
      \`user_id\` varchar(255) NOT NULL,
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`announcement_targets_announcement_user_idx\` (\`announcement_id\`, \`user_id\`),
      KEY \`announcement_targets_announcement_id_idx\` (\`announcement_id\`),
      KEY \`announcement_targets_user_id_idx\` (\`user_id\`),
      CONSTRAINT \`announcement_targets_announcement_fk\`
        FOREIGN KEY (\`announcement_id\`) REFERENCES \`announcements\` (\`id\`)
        ON DELETE CASCADE,
      CONSTRAINT \`announcement_targets_user_fk\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
        ON DELETE CASCADE
    )
  `);

  await createIndexIfMissing(
    db,
    "announcement_targets",
    "announcement_targets_announcement_id_idx",
    sql`CREATE INDEX \`announcement_targets_announcement_id_idx\` ON \`announcement_targets\` (\`announcement_id\`)`,
  );

  await createIndexIfMissing(
    db,
    "announcement_targets",
    "announcement_targets_user_id_idx",
    sql`CREATE INDEX \`announcement_targets_user_id_idx\` ON \`announcement_targets\` (\`user_id\`)`,
  );

  await createIndexIfMissing(
    db,
    "announcement_targets",
    "announcement_targets_announcement_user_idx",
    sql`CREATE UNIQUE INDEX \`announcement_targets_announcement_user_idx\` ON \`announcement_targets\` (\`announcement_id\`, \`user_id\`)`,
  );

  console.log("Announcements targets and visibility migration completed.");
}

runMigration().catch((error: unknown) => {
  console.error("Announcements targets and visibility migration failed.");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
});
