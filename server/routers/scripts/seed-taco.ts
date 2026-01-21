import { getDb } from "../../db";
import { ingredients } from "drizzle/schema/nutrition";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configuração para ES Modules (Node.js 20+)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função auxiliar para limpar valores como "NA", "Tr" ou vazios
const formatValue = (val: any): string => {
  if (typeof val === 'number') return val.toFixed(2);
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
};

async function seedTaco() {
  const db = await getDb();
  
  // Usaremos o arquivo 'tabela_alimentos.json' que você acabou de subir
  const filePath = path.resolve(__dirname, "tabela_alimentos.json");
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Erro: Arquivo tabela_alimentos.json não encontrado em: ${filePath}`);
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const tacoData = JSON.parse(rawData); // O seu arquivo já é uma lista direta []

  console.log(`🚀 Iniciando importação de ${tacoData.length} itens da TACO...`);

  const batchSize = 100;
  for (let i = 0; i < tacoData.length; i += batchSize) {
    const batch = tacoData.slice(i, i + batchSize).map((item: any) => ({
      name: item.description, // Mapeado de 'description'
      source: "TACO",
      externalId: String(item.id),
      yieldFactor: "1.00",
      calories: formatValue(item.energy_kcal), // Mapeado de 'energy_kcal'
      protein: formatValue(item.protein_g),    // Mapeado de 'protein_g'
      carbohydrates: formatValue(item.carbohydrate_g), // Mapeado de 'carbohydrate_g'
      fats: formatValue(item.lipid_g),         // Mapeado de 'lipid_g'
      fiber: formatValue(item.fiber_g),        // Mapeado de 'fiber_g'
      sodium: formatValue(item.sodium_mg),     // Mapeado de 'sodium_mg'
      unit: "g"
    }));

    try {
      await db.insert(ingredients).values(batch);
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} processado...`);
    } catch (error) {
      console.error(`❌ Erro no lote ${i}:`, error);
    }
  }

  console.log("✨ Importação concluída com sucesso!");
  process.exit(0);
}

seedTaco();