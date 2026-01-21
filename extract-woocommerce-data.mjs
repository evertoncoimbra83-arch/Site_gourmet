import fetch from 'node-fetch';
import * as fs from 'fs';

const WOO_URL = 'https://gourmetsaudavel.com.br';
const CONSUMER_KEY = 'ck_9886ee50d6a6eea496ccf24f24c21d2a496f603c';
const CONSUMER_SECRET = 'cs_95368563fa7635e00fd9fc689c9a7988f573697e';

// Função para fazer requisições autenticadas
async function fetchWooCommerce(endpoint, params = {}) {
  const url = new URL(`${WOO_URL}/wp-json/wc/v3${endpoint}`);
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Erro ${response.status}:`, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error.message);
    return null;
  }
}

// Extrair todos os produtos
async function extractProducts() {
  console.log('📦 Extraindo produtos...');
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWooCommerce('/products', { per_page: 100, page });
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allProducts = allProducts.concat(data);
      page++;
    }
  }

  return allProducts;
}

// Extrair todas as categorias
async function extractCategories() {
  console.log('📂 Extraindo categorias...');
  let allCategories = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWooCommerce('/products/categories', { per_page: 100, page });
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allCategories = allCategories.concat(data);
      page++;
    }
  }

  return allCategories;
}

// Extrair todos os usuários
async function extractCustomers() {
  console.log('👥 Extraindo usuários...');
  let allCustomers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWooCommerce('/customers', { per_page: 100, page });
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allCustomers = allCustomers.concat(data);
      page++;
    }
  }

  return allCustomers;
}

// Extrair pedidos
async function extractOrders() {
  console.log('📋 Extraindo pedidos...');
  let allOrders = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchWooCommerce('/orders', { per_page: 100, page });
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allOrders = allOrders.concat(data);
      page++;
    }
  }

  return allOrders;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando extração de dados do WooCommerce...\n');

  const products = await extractProducts();
  const categories = await extractCategories();
  const customers = await extractCustomers();
  const orders = await extractOrders();

  // Salvar dados em arquivos JSON
  const data = {
    timestamp: new Date().toISOString(),
    products: products.length,
    categories: categories.length,
    customers: customers.length,
    orders: orders.length,
  };

  fs.writeFileSync('/home/ubuntu/gourmet_saudavel/woo-products.json', JSON.stringify(products, null, 2));
  fs.writeFileSync('/home/ubuntu/gourmet_saudavel/woo-categories.json', JSON.stringify(categories, null, 2));
  fs.writeFileSync('/home/ubuntu/gourmet_saudavel/woo-customers.json', JSON.stringify(customers, null, 2));
  fs.writeFileSync('/home/ubuntu/gourmet_saudavel/woo-orders.json', JSON.stringify(orders, null, 2));
  fs.writeFileSync('/home/ubuntu/gourmet_saudavel/woo-summary.json', JSON.stringify(data, null, 2));

  console.log('\n✅ Extração concluída!');
  console.log(`📊 Resumo:`);
  console.log(`  - Produtos: ${products.length}`);
  console.log(`  - Categorias: ${categories.length}`);
  console.log(`  - Clientes: ${customers.length}`);
  console.log(`  - Pedidos: ${orders.length}`);
  console.log('\n📁 Arquivos salvos em:');
  console.log(`  - woo-products.json`);
  console.log(`  - woo-categories.json`);
  console.log(`  - woo-customers.json`);
  console.log(`  - woo-orders.json`);
  console.log(`  - woo-summary.json`);
}

main().catch(console.error);
