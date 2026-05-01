import { getDb } from "../server/db";
import { 
  accompanimentOptions, 
  groupToOptions, 
  dishSizes, 
  sizeAccompanimentGroups 
} from "../drizzle/schema/";
import { sql } from "drizzle-orm";

async function runMigration() {
  const db = await getDb();
  

  try {
    // --- 1. MIGRAR OPÇÕES -> GRUPOS ---
    
    const options = await db.select().from(accompanimentOptions);
    
    for (const opt of options) {
      let config: any[] = [];
      if (typeof opt.groupsConfig === 'string') {
        try { config = JSON.parse(opt.groupsConfig); } catch (e) { config = []; }
      } else if (Array.isArray(opt.groupsConfig)) {
        config = opt.groupsConfig;
      }

      if (config.length > 0) {
        
        for (const c of config) {
          const gId = Number(c.group_id || c.groupId);
          if (gId) {
            await db.insert(groupToOptions).values({
              groupId: gId,
              optionId: opt.id
            }).onDuplicateKeyUpdate({ set: { groupId: gId } });
          }
        }
      }
    }

    // --- 2. MIGRAR TAMANHOS -> GRUPOS ---
    
    const sizes = await db.select().from(dishSizes);
    
    for (const size of sizes) {
      let order: any[] = [];
      if (typeof size.groupsOrder === 'string') {
        try { order = JSON.parse(size.groupsOrder); } catch (e) { order = []; }
      } else if (Array.isArray(size.groupsOrder)) {
        order = size.groupsOrder;
      }

      if (order.length > 0) {
        
        for (const gId of order) {
          if (Number(gId)) {
            await db.insert(sizeAccompanimentGroups).values({
              sizeId: size.id,
              accompanimentGroupId: Number(gId)
            }).onDuplicateKeyUpdate({ set: { sizeId: size.id } });
          }
        }
      }
    }

    
    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
}

runMigration();