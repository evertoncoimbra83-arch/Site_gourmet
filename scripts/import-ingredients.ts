import fs from 'node:fs';
import readline from 'node:readline';
import { getDb } from '../server/db.js'; 
import { ingredients } from '../drizzle/schema'; 

async function importTacoData() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Não foi possível conectar à base de dados.");
    return;
  }

  const filePath = './alimentos_corrigido.jsonl'; 
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  console.log("🚀 Iniciando importação robusta (TBCA)...");

  // ✅ Função para limpar hífens, "tr", "NA" e converter para decimal válido
  const parseVal = (val: any): string => {
    if (val === undefined || val === null) return "0.00";
    const s = String(val).trim();
    if (s === "" || s === "-" || s === "NA" || s === "tr" || s === "n.d.") return "0.00";
    const normalized = s.replace(',', '.');
    return isNaN(parseFloat(normalized)) ? "0.00" : normalized;
  };

  let count = 0;
  let errors = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const data = JSON.parse(line);
      const nuts: any = {};
      data.nutrientes.forEach((n: any) => {
        nuts[`${n.componente}_${n.unidade}`] = n.valor_por_100g;
      });

      const carbs = nuts['Carboidrato total_g'] || nuts['Carboidrato disponível_g'];

      // ✅ Garante que nomes gigantes não quebrem o banco (mesmo se for TEXT)
      const safeName = data.nome.length > 500 ? data.nome.substring(0, 497) + "..." : data.nome;

      await db.insert(ingredients).values({
        name: safeName,
        category: data.classe || "Outros",
        source: 'TBCA',
        externalId: data.codigo,
        yieldFactor: "1.00",
        calories: parseVal(nuts['Energia_kcal']),
        energyKj: parseVal(nuts['Energia_kJ']),
        carbohydrates: parseVal(carbs),
        addedSugars: parseVal(nuts['Açúcar de adição_g']),
        protein: parseVal(nuts['Proteína_g']),
        fats: parseVal(nuts['Lipídios_g']),
        fatSaturated: parseVal(nuts['Ácidos graxos saturados_g']),
        fatTrans: parseVal(nuts['Ácidos graxos trans_g']),
        fiber: parseVal(nuts['Fibra alimentar_g']),
        sodium: parseVal(nuts['Sódio_mg']),
        unit: 'g'
      });

      count++;
      if (count % 500 === 0) console.log(`⏳ Processados ${count} itens...`);

    } catch (err) {
      errors++;
      console.error(`❌ Erro no item ${count + 1}:`, (err as any).sqlMessage || err);
    }
  }

  console.log(`\n✅ Importação Finalizada!`);
  console.log(`📊 Sucessos: ${count}`);
  console.log(`⚠️ Falhas: ${errors}`);
  
  process.exit(0);
}

importTacoData().catch(console.error);