import { mysqlTable, varchar, tinyint, timestamp, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { encryptedText } from "../../server/encryption.js"; 

export const userAddresses = mysqlTable("user_addresses", {
  /**
   * ✅ ID DO ENDEREÇO
   * Alterado para varchar(255) para suportar os IDs de entropia do Lucia/Servidor.
   * Removemos o autoincrement().
   */
  id: varchar("id", { length: 255 }).primaryKey(),

  /**
   * ✅ VÍNCULO COM USUÁRIO
   * Alterado para varchar(255) para bater com o novo ID da tabela 'users'.
   * Isso resolve o Erro 500 na listagem de endereços.
   */
  userId: varchar("user_id", { length: 255 }).notNull(),
  
  // ✅ Campos criptografados preservados
  label: encryptedText("label"),
  street: encryptedText("address"), 
  number: encryptedText("number"),
  complement: encryptedText("complement"),
  neighborhood: encryptedText("neighborhood"),
  zipCode: encryptedText("zip_code"),
  city: encryptedText("city"),
  state: encryptedText("state"),
  phone: encryptedText("phone"),
  receiverName: encryptedText("receiver_name"),
  
  // ✅ isDefault como tinyint (padrão MySQL para booleano)
  isDefault: tinyint("is_default").default(0),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Alias para exportação unificada
export const addresses = userAddresses;