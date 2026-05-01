import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cidades do seu interesse
const CIDADES_ALVO = ["Jundiaí", "Várzea Paulista", "Itupeva", "Louveira", "Itatiba"];

async function extrair() {
  // Caminho do BR.txt (ajuste se estiver em outro lugar)
  const filePath = path.resolve(__dirname, '../BR.txt');
  const outputPath = path.resolve(__dirname, '../ceps-regiao.json');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo BR.txt não encontrado em: ${filePath}`);
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("📂 Extraindo dados do GeoNames para JSON...");
  const resultado = [];

  for await (const line of rl) {
    const columns = line.split('\t');
    const cep = columns[1];
    const bairro = columns[2];
    const cidade = columns[5];
    const lat = columns[9];
    const lng = columns[10];

    if (CIDADES_ALVO.includes(cidade) && cep && lat && lng) {
      resultado.push({
        cep: cep.replace(/\D/g, ""),
        cidade,
        bairro: bairro || "Centro",
        lat,
        lng
      });
    }
  }

  // Salva o arquivo JSON
  fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2));
  
  console.log(`\n🎉 SUCESSO!`);
  console.log(`📍 Arquivo gerado: ceps-regiao.json`);
  console.log(`📦 Total de CEPs encontrados: ${resultado.length}`);
}

extrair();