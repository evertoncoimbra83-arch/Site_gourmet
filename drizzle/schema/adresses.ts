import { mysqlTable, varchar, tinyint, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { encryptedText } from "../../server/encryption"; 

export const userAddresses = mysqlTable("user_addresses", {
  /**
   * ✅ ID DO ENDEREÇO
   * Suporta os IDs de entropia do Lucia/Servidor.
   */
  id: varchar("id", { length: 255 }).primaryKey(),

  /**
   * ✅ VÍNCULO COM USUÁRIO
   * Bate com o ID da tabela 'users'. 
   * Removido o .notNull() para permitir que o endereço exista antes da criação da conta.
   */
  userId: varchar("user_id", { length: 255 }),
  
  /**
   * ✅ VÍNCULO COM O CARRINHO
   * Essencial para manter o endereço vinculado à sessão do visitante (Guest).
   */
  cartId: varchar("cart_id", { length: 255 }),

  // ✅ Mapeamento de campos criptografados
  // Note que o Drizzle usará o nome da propriedade (ex: zipCode) no TS
  // e o nome da coluna (ex: zip_code) no SQL.
  label: encryptedText("label"),
  street: encryptedText("address"), 
  number: encryptedText("number"),
  complement: encryptedText("complement"),
  neighborhood: encryptedText("neighborhood"),
  
  /**
   * ✅ PADRONIZAÇÃO DE CEP
   * Alinhado com a busca global: TS usa zipCode, DB usa zip_code.
   */
  zipCode: encryptedText("zip_code"),
  
  city: encryptedText("city"),
  state: encryptedText("state"),
  phone: encryptedText("phone"),
  receiverName: encryptedText("receiver_name"),

  /**
   * ✅ COORDENADAS GEOGRÁFICAS
   * Importante para a validação de polígonos e raios no motor de frete.
   */
  lat: varchar("lat", { length: 50 }),
  lng: varchar("lng", { length: 50 }),
  
  // ✅ isDefault como tinyint (0 ou 1)
  isDefault: tinyint("is_default").default(0),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

// Alias para exportação unificada conforme padrão do projeto
export const addresses = userAddresses;