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

  // Columns for bi_sales_facts
  await addColumnIfMissing(
    db,
    "bi_sales_facts",
    "is_customized",
    sql`ALTER TABLE \`bi_sales_facts\` ADD COLUMN \`is_customized\` int DEFAULT 0`,
  );

  await addColumnIfMissing(
    db,
    "bi_sales_facts",
    "is_from_kit",
    sql`ALTER TABLE \`bi_sales_facts\` ADD COLUMN \`is_from_kit\` int DEFAULT 0`,
  );

  await addColumnIfMissing(
    db,
    "bi_sales_facts",
    "macro_deviation_kcal",
    sql`ALTER TABLE \`bi_sales_facts\` ADD COLUMN \`macro_deviation_kcal\` int DEFAULT 0`,
  );

  // Indexes for bi_sales_facts
  await createIndexIfMissing(
    db,
    "bi_sales_facts",
    "bi_sales_facts_order_id_idx",
    sql`CREATE INDEX \`bi_sales_facts_order_id_idx\` ON \`bi_sales_facts\` (\`order_id\`)`,
  );

  await createIndexIfMissing(
    db,
    "bi_sales_facts",
    "bi_sales_facts_date_id_idx",
    sql`CREATE INDEX \`bi_sales_facts_date_id_idx\` ON \`bi_sales_facts\` (\`date_id\`)`,
  );

  await createIndexIfMissing(
    db,
    "bi_sales_facts",
    "bi_sales_facts_dish_id_idx",
    sql`CREATE INDEX \`bi_sales_facts_dish_id_idx\` ON \`bi_sales_facts\` (\`dish_id\`)`,
  );

  // Indexes for bi_financial_facts
  await createIndexIfMissing(
    db,
    "bi_financial_facts",
    "bi_financial_facts_order_id_idx",
    sql`CREATE INDEX \`bi_financial_facts_order_id_idx\` ON \`bi_financial_facts\` (\`order_id\`)`,
  );

  await createIndexIfMissing(
    db,
    "bi_financial_facts",
    "bi_financial_facts_date_id_idx",
    sql`CREATE INDEX \`bi_financial_facts_date_id_idx\` ON \`bi_financial_facts\` (\`date_id\`)`,
  );

  console.log("BI Analytics columns and indexes migration completed successfully.");
}

runMigration().catch((error: unknown) => {
  console.error("BI Analytics columns and indexes migration failed.");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
});
