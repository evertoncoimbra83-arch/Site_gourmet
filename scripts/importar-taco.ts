import "dotenv/config";
import { getDb } from "../server/db";
import { ingredients } from "../drizzle/schema/nutrition";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

// --- RESOLVENDO __dirname EM ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper definitivo para converter valores da TACO para Decimal do MySQL.
 * Trata "Tr", "NA", "*", campos vazios e "NaN".
 */
const clean = (val: any): string => {
  if (val === undefined || val === null || val === "") return "0.00";
  
  // Converte para string e limpa espaços e vírgulas
  let strVal = String(val).replace(",", ".").trim().toLowerCase();
  
  // Lista de valores não numéricos comuns na TACO que devem ser 0
  if (strVal === "tr" || strVal === "na" || strVal === "*" || strVal === "nan") {
    return "0.00";
  }
  
  const num = parseFloat(strVal);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

async function importarTacoCSVs() {
  console.log("\n🥗 Iniciando importação da TACO (Arquivos CSV)...");

  const db = await getDb();
  if (!db) throw new Error("Erro ao conectar ao banco de dados.");

  // Caminhos dos ficheiros na mesma pasta scripts/
  const alimentosPath = path.join(__dirname, "alimentos.csv");
  const acidosPath = path.join(__dirname, "acidos-graxos.csv");

  if (!fs.existsSync(alimentosPath) || !fs.existsSync(acidosPath)) {
    throw new Error(`Ficheiros não encontrados em: ${__dirname}`);
  }

  // 1. Carregar Dados com Tipagem Correta
  const alimentosFile = fs.readFileSync(alimentosPath, "utf-8");
  const alimentosData = parse(alimentosFile, { 
    columns: true, 
    delimiter: ";",
    skip_empty_lines: true 
  }) as Record<string, string>[];

  const acidosFile = fs.readFileSync(acidosPath, "utf-8");
  const acidosData = parse(acidosFile, { 
    columns: true, 
    delimiter: ";",
    skip_empty_lines: true 
  }) as Record<string, string>[];

  let total = 0;

  for (const row of alimentosData) {
    const idAlimento = row["Número do Alimento"];
    
    // Procura gorduras no ficheiro de ácidos graxos
    const gordura = acidosData.find((a) => a["Número do Alimento"] === idAlimento);
    
    // Cálculo da Gordura Trans (soma isômeros 18:1t e 18:2t)
    const trans1 = parseFloat(clean(gordura?.["18:1t (g)"]));
    const trans2 = parseFloat(clean(gordura?.["18:2t (g)"]));
    
    // Garante que a soma não resulte em NaN antes de converter para string
    const somaTrans = trans1 + trans2;
    const transTotal = isNaN(somaTrans) ? "0.00" : somaTrans.toFixed(2);

    const payload = {
      name: row["Descrição dos alimentos"],
      source: "TACO",
      externalId: String(idAlimento),
      energyKcal: clean(row["Energia (kcal)"]),
      energyKj: clean(row["Energia (kJ)"]),
      protein: clean(row["Proteína (g)"]),
      carbohydrates: clean(row["Carboidrato (g)"]),
      fatTotal: clean(row["Lipídeos (g)"]),
      fatSaturated: clean(gordura?.["Saturados (g)"]),
      fatTrans: transTotal,
      fiber: clean(row["Fibra Alimentar (g)"]),
      sodium: clean(row["Sódio (mg)"]),
      unit: "g",
      yieldFactor: "1.00"
    };

    try {
      // Upsert: Procura por externalId (ID original da TACO) para não duplicar
      const [existente] = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.externalId, payload.externalId))
        .limit(1);

      if (existente) {
        await db.update(ingredients)
          .set(payload)
          .where(eq(ingredients.id, existente.id));
      } else {
        await db.insert(ingredients).values(payload);
      }
      
      total++;
      if (total % 50 === 0) process.stdout.write("▓");
    } catch (err) {
      console.error(`\n❌ Erro no alimento ID ${idAlimento}:`, err);
    }
  }

  console.log(`\n\n✅ Sucesso! Processo finalizado.`);
  console.log(`📊 Total de ingredientes processados: ${total}`);
  process.exit(0);
}

importarTacoCSVs();