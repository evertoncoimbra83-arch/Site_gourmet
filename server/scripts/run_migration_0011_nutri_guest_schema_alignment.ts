import { sql, type SQL } from "drizzle-orm";

import { getDb } from "../db.js";

type Db = Awaited<ReturnType<typeof getDb>>;

type ColumnMigration = {
  tableName: string;
  columnName: string;
  ddl: SQL;
};

const columnMigrations: ColumnMigration[] = [
  {
    tableName: "orders",
    columnName: "public_access_token",
    ddl: sql`ALTER TABLE \`orders\` ADD COLUMN \`public_access_token\` varchar(64) NULL`,
  },
  {
    tableName: "dish_sizes",
    columnName: "no_accompaniments_message",
    ddl: sql`ALTER TABLE \`dish_sizes\` ADD COLUMN \`no_accompaniments_message\` varchar(255) NULL`,
  },
  {
    tableName: "accompaniment_options",
    columnName: "is_no_accompaniment",
    ddl: sql`ALTER TABLE \`accompaniment_options\` ADD COLUMN \`is_no_accompaniment\` tinyint(1) NOT NULL DEFAULT 0`,
  },
];

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

async function runMigration(): Promise<void> {
  const db = await getDb();

  for (const migration of columnMigrations) {
    const exists = await columnExists(
      db,
      migration.tableName,
      migration.columnName,
    );

    if (exists) {
      console.log(
        `Skipping ${migration.tableName}.${migration.columnName}: column already exists.`,
      );
      continue;
    }

    console.log(`Adding ${migration.tableName}.${migration.columnName}...`);
    await db.execute(migration.ddl);
    console.log(`Added ${migration.tableName}.${migration.columnName}.`);
  }

  console.log("Nutri/guest schema alignment migration completed.");
}

runMigration().catch((error: unknown) => {
  console.error("Nutri/guest schema alignment migration failed.");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
});
