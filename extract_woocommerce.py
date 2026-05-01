#!/usr/bin/env python3
import requests
import json
from requests.auth import HTTPBasicAuth

WOO_URL = 'https://gourmetsaudavel.com'
CONSUMER_KEY = 'ck_9886ee50d6a6eea496ccf24f24c21d2a496f603c'
CONSUMER_SECRET = 'cs_95368563fa7635e00fd9fc689c9a7988f573697e'

def fetch_woocommerce(endpoint, params=None):
    """Fazer requisição autenticada ao WooCommerce"""
    url = f'{WOO_URL}/wp-json/wc/v3{endpoint}'
    auth = HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET)
    
    try:
        response = requests.get(url, auth=auth, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'❌ Erro na requisição: {e}')
        return None

def extract_all_paginated(endpoint, per_page=100):
    """Extrair todos os dados com paginação"""
    all_data = []
    page = 1
    
    while True:
        print(f'  📄 Página {page}...', end=' ', flush=True)
        data = fetch_woocommerce(endpoint, {'per_page': per_page, 'page': page})
        
        if not data or len(data) == 0:
            print('✅')
            break
        
        all_data.extend(data)
        print(f'({len(data)} itens)')
        page += 1
    
    return all_data

def main():
    print('🚀 Iniciando extração de dados do WooCommerce...\n')
    
    # Extrair produtos
    print('📦 Extraindo produtos...')
    products = extract_all_paginated('/products')
    
    # Extrair categorias
    print('📂 Extraindo categorias...')
    categories = extract_all_paginated('/products/categories')
    
    # Extrair clientes
    print('👥 Extraindo clientes...')
    customers = extract_all_paginated('/customers')
    
    # Extrair pedidos
    print('📋 Extraindo pedidos...')
    orders = extract_all_paginated('/orders')
    
    # Salvar dados
    print('\n💾 Salvando dados...')
    
    with open('/home/ubuntu/gourmet_saudavel/woo-products.json', 'w') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    with open('/home/ubuntu/gourmet_saudavel/woo-categories.json', 'w') as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    
    with open('/home/ubuntu/gourmet_saudavel/woo-customers.json', 'w') as f:
        json.dump(customers, f, indent=2, ensure_ascii=False)
    
    with open('/home/ubuntu/gourmet_saudavel/woo-orders.json', 'w') as f:
        json.dump(orders, f, indent=2, ensure_ascii=False)
    
    summary = {
        'timestamp': str(__import__('datetime').datetime.now()),
        'products_count': len(products),
        'categories_count': len(categories),
        'customers_count': len(customers),
        'orders_count': len(orders)
    }
    
    with open('/home/ubuntu/gourmet_saudavel/woo-summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print('\n✅ Extração concluída!')
    print(f'\n📊 Resumo:')
    print(f'  - Produtos: {len(products)}')
    print(f'  - Categorias: {len(categories)}')
    print(f'  - Clientes: {len(customers)}')
    print(f'  - Pedidos: {len(orders)}')
    print(f'\n📁 Arquivos salvos em /home/ubuntu/gourmet_saudavel/')

if __name__ == '__main__':
    main()
