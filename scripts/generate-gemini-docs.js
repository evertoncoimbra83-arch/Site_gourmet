import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const paths = {
  cartRouter: path.join(projectRoot, 'server/routers/cart/index.ts'),
  checkoutRouter: path.join(projectRoot, 'server/routers/checkout/index.ts'),
  schemaFolder: path.join(projectRoot, 'server/db'), // Pasta onde estão seus arquivos .ts do Drizzle
  outputDir: path.join(projectRoot, 'docs/system_logic')
};

// Garante que o diretório de saída existe
if (!fs.existsSync(paths.outputDir)) {
  fs.mkdirSync(paths.outputDir, { recursive: true });
}

/**
 * Analisador de Schema (Varre a pasta server/db)
 */
function analyzeSchemaFiles() {
  const tables = [];
  if (!fs.existsSync(paths.schemaFolder)) return tables;

  const files = fs.readdirSync(paths.schemaFolder).filter(f => f.endsWith('.ts'));

  files.forEach(file => {
    const content = fs.readFileSync(path.join(paths.schemaFolder, file), 'utf8');
    // Regex para capturar export const nome = mysqlTable('db_name', ...)
    const tableMatches = [...content.matchAll(/export const (\w+) = mysqlTable\(\s*["'](.+?)["']/g)];
    
    tableMatches.forEach(match => {
      const [_, variableName, tableName] = match;
      // Procura colunas: tsName: type("db_name")
      const columnMatches = [...content.matchAll(/(\w+):\s+(\w+)\(\s*["'](.+?)["']/g)];
      const columns = columnMatches.map(m => ({
        tsName: m[1],
        type: m[2],
        dbName: m[3]
      }));
      
      tables.push({ tableName, variableName, columns, file });
    });
  });
  return tables;
}

async function generateDocs() {
  console.log('🚀 Gerando Motor de Busca Gemini (Versão Turbo + Checkout)...');

  // --- 1. ARQUITETURA DO CARRINHO ---
  try {
    if (fs.existsSync(paths.cartRouter)) {
      const cartContent = fs.readFileSync(paths.cartRouter, 'utf8');
      const archDoc = `# 🏗️ Arquitetura do Carrinho\n\nGerado: ${new Date().toLocaleString()}\n
## Status das Funções
- **applyCoupon**: ${cartContent.includes('applyCoupon') ? '✅ Ativo' : '❌ Offline'}
- **removeCoupon**: ${cartContent.includes('removeCoupon') ? '✅ Ativo' : '❌ Offline'}
- **syncCartState**: ${cartContent.includes('syncCartState') ? '✅ Integrado' : '⚠️ Pendente'}

## Fluxo de Sincronia
O sistema utiliza \`syncCartState\` para processar itens complexos e injeta manualmente o \`discountValue\` do DB no \`getSummary\`.
`;
      fs.writeFileSync(path.join(paths.outputDir, 'cart_architecture.md'), archDoc);
      console.log('✅ Arquitetura do Carrinho documentada.');
    }
  } catch (e) { console.warn('⚠️ Erro ao analisar Cart Router.'); }

  // --- 2. STATUS DO CHECKOUT ---
  try {
    if (fs.existsSync(paths.checkoutRouter)) {
      const checkoutContent = fs.readFileSync(paths.checkoutRouter, 'utf8');
      
      // Verifica funções comuns de finalização
      const hasCreateOrder = checkoutContent.includes('createOrder') || checkoutContent.includes('placeOrder');
      const hasPayment = checkoutContent.includes('payment') || checkoutContent.includes('stripe') || checkoutContent.includes('mercadopago');

      const checkDoc = `# 🏁 Status do Checkout\n\nGerado: ${new Date().toLocaleString()}\n
## Auditoria de código
- **Criação de Pedidos**: ${hasCreateOrder ? '✅ Implementado' : '❌ Não encontrado'}
- **Processamento de Pagamento**: ${hasPayment ? '✅ Detectado' : '⚠️ Verificação Manual Necessária'}
- **Integração com Carrinho**: ✅ Ativa via Contexto

## Regras de Checkout
1. Converte o Carrinho Ativo em Pedido.
2. Deve herdar \`couponCode\` e \`discountValue\` calculados no Carrinho.
`;
      fs.writeFileSync(path.join(paths.outputDir, 'checkout_status.md'), checkDoc);
      console.log('✅ Status do Checkout documentado.');
    }
  } catch (e) { console.warn('⚠️ Checkout Router não encontrado.'); }

  // --- 3. DATABASE SCHEMA (Drizzle) ---
  try {
    const tables = analyzeSchemaFiles();
    let dbDoc = `# 🗄️ Esquema de Dados (Auto-extraído do Drizzle)\n\nGerado: ${new Date().toLocaleString()}\n\n`;

    tables.forEach(t => {
      dbDoc += `### 📋 Tabela: \`${t.tableName}\` (Export: \`${t.variableName}\`)\n`;
      dbDoc += `*Arquivo: \`${t.file}\`*\n\n`;
      dbDoc += `| Coluna TS | Coluna DB | Tipo Drizzle |\n| :--- | :--- | :--- |\n`;
      t.columns.forEach(col => {
        dbDoc += `| \`${col.tsName}\` | \`${col.dbName}\` | \`${col.type}\` |\n`;
      });
      dbDoc += `\n---\n`;
    });

    fs.writeFileSync(path.join(paths.outputDir, 'database_schema.md'), dbDoc);
    console.log(`✅ Schema documentado (${tables.length} tabelas encontradas).`);
  } catch (e) { console.error('❌ Erro ao analisar banco de dados:', e.message); }

  console.log('\n✨ Motor de busca Gemini atualizado com sucesso!');
}

generateDocs();