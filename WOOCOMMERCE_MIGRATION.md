# 🔄 Guia de Migração: WooCommerce → Gourmet Saudável

Este guia explica como migrar dados do WooCommerce para o novo sistema Gourmet Saudável, criptografando automaticamente todos os campos sensíveis durante a migração.

---

## 📋 O Que Será Migrado

### ✅ Dados Migrados

| Origem (WooCommerce) | Destino (Gourmet Saudável) | Criptografia |
|----------------------|----------------------------|--------------|
| `wp_users` | `users` | ❌ Não |
| `wp_usermeta` (billing/shipping) | `user_profiles` | ✅ Sim (telefone, cidade, CEP, CPF) |
| `wp_usermeta` (endereços) | `customer_addresses` | ✅ Sim (rua, número, bairro, cidade, CEP, telefone) |
| `wp_wc_order_stats` | `orders` | ❌ Não (histórico) |

### ❌ Dados NÃO Migrados

- Produtos (devem ser recadastrados no novo sistema)
- Categorias (estrutura diferente)
- Cupons (recriar manualmente)
- Configurações do site

---

## ⚠️ ANTES DE COMEÇAR

### 1. **Backup dos Bancos**

```bash
# Backup do WooCommerce
mysqldump -u root -p local > backup_woocommerce.sql

# Backup do Gourmet Saudável
mysqldump -u root -p gourmet_saudavel > backup_gourmet_antes_migracao.sql
```

### 2. **Prepare os Bancos**

```sql
-- Certifique-se de que ambos os bancos existem
SHOW DATABASES LIKE 'local';
SHOW DATABASES LIKE 'gourmet_saudavel';

-- Altere tipos de colunas no Gourmet Saudável (se ainda não fez)
USE gourmet_saudavel;
SOURCE scripts/01-alter-columns-for-encryption.sql;
```

### 3. **Configure Variáveis de Ambiente**

Copie o arquivo de exemplo:
```bash
cp .env.migration.example .env
```

Edite o `.env` e configure:

```env
# Banco WooCommerce (origem)
WC_DB_HOST=localhost
WC_DB_USER=root
WC_DB_PASSWORD=sua_senha
WC_DB_NAME=local

# Banco Gourmet Saudável (destino)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=gourmet_saudavel

# Chave de criptografia (gere com: openssl rand -base64 32)
ENCRYPTION_KEY=sua_chave_aqui
```

---

## 🚀 Executando a Migração

### **Comando**

```bash
cd gourmet_saudavel
pnpm tsx scripts/migrate-woocommerce-to-gourmet.ts
```

### **Saída Esperada**

```
🔄 Iniciando migração WooCommerce → Gourmet Saudável

✅ ENCRYPTION_KEY configurada
⚠️  IMPORTANTE: Certifique-se de ter feito backup dos bancos!

   Iniciando em 3 segundos... (Ctrl+C para cancelar)

📡 Conectando aos bancos de dados...
   ✅ Conectado ao WooCommerce (local)
   ✅ Conectado ao Gourmet Saudável (gourmet_saudavel)

👤 Migrando usuários...
   Encontrados 435 usuários no WooCommerce
   ✅ Usuário migrado: cliente1@email.com
   ✅ Usuário migrado: cliente2@email.com
   ...
   ✅ Usuários: 435 migrados, 0 já existiam, 0 erros

🏠 Migrando perfis e endereços...
   Encontrados 435 clientes
   ✅ Perfil e endereço migrados: cliente1@email.com
   ✅ Perfil e endereço migrados: cliente2@email.com
   ...
   ✅ Endereços: 435 migrados, 0 já existiam, 0 erros

📦 Migrando pedidos...
   Encontrados 1250 pedidos (últimos 6 meses)
   ✅ Pedidos: 1250 migrados, 0 já existiam, 0 erros

============================================================
📊 RESUMO DA MIGRAÇÃO
============================================================

👤 Usuários:
   Migrados: 435
   Já existiam: 0
   Erros: 0

🏠 Endereços:
   Migrados: 435
   Já existiam: 0
   Erros: 0

📦 Pedidos:
   Migrados: 1250
   Já existiam: 0
   Erros: 0

============================================================
✅ Migração concluída com sucesso!
============================================================
```

---

## 🔍 Verificando a Migração

### **1. Contar Registros**

```sql
USE gourmet_saudavel;

-- Usuários migrados
SELECT COUNT(*) as total_users FROM users;

-- Perfis criados
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Endereços migrados
SELECT COUNT(*) as total_addresses FROM customer_addresses;

-- Pedidos migrados
SELECT COUNT(*) as total_orders FROM orders;
```

### **2. Verificar Criptografia**

```sql
-- Ver exemplo de CPF criptografado
SELECT 
  id,
  LENGTH(customer_document) as tamanho_criptografado,
  LEFT(customer_document, 50) as preview
FROM user_profiles 
WHERE customer_document IS NOT NULL 
LIMIT 5;

-- Resultado esperado:
-- tamanho_criptografado: ~100-150 caracteres
-- preview: "a1b2c3d4...:e5f6g7h8...:i9j0k1l2..."
```

### **3. Testar Login**

```bash
# Inicie o servidor
pnpm dev

# Acesse http://localhost:3000
# Tente fazer login com um email migrado
```

---

## 🔄 Executar Novamente

O script é **idempotente** - pode ser executado múltiplas vezes:

- Detecta registros já migrados (por email)
- Pula duplicatas automaticamente
- Migra apenas dados novos

```bash
# Pode executar quantas vezes quiser
pnpm tsx scripts/migrate-woocommerce-to-gourmet.ts
```

---

## 🎯 Mapeamento de Campos

### **Usuários (wp_users → users)**

| WooCommerce | Gourmet Saudável | Transformação |
|-------------|------------------|---------------|
| `ID` | `open_id` | Prefixo `wc_` |
| `user_email` | `email` | Direto |
| `display_name` | `name` | Direto |
| `user_registered` | `created_at` | Direto |
| - | `role` | Sempre `user` |

### **Perfis (wp_usermeta → user_profiles)**

| WooCommerce | Gourmet Saudável | Criptografia |
|-------------|------------------|--------------|
| `billing_phone` | `phone` | ✅ Sim |
| `billing_city` | `city` | ✅ Sim |
| `billing_state` | `state` | ✅ Sim |
| `billing_postcode` | `zip_code` | ✅ Sim |
| `billing_cpf` / `billing_cnpj` | `customer_document` | ✅ Sim |

### **Endereços (wp_usermeta → customer_addresses)**

| WooCommerce | Gourmet Saudável | Criptografia |
|-------------|------------------|--------------|
| `billing_address_1` | `street` | ✅ Sim |
| - | `number` | ✅ Sim (padrão "S/N") |
| `billing_address_2` | `complement` | ✅ Sim |
| `shipping_neighborhood` | `neighborhood` | ✅ Sim |
| `billing_city` | `city` | ✅ Sim |
| `billing_state` | `state` | ❌ Não (2 letras) |
| `billing_postcode` | `zip_code` | ✅ Sim |
| `billing_phone` | `phone` | ✅ Sim |

### **Pedidos (wp_wc_order_stats → orders)**

| WooCommerce | Gourmet Saudável | Transformação |
|-------------|------------------|---------------|
| `order_id` | - | Não migrado (novo ID) |
| `total_sales` | `total` | Direto |
| `net_total` | `subtotal` | Direto |
| `status` | `status` | Mapeado (wc-pending → pending) |
| `date_created` | `created_at` | Direto |
| - | `payment_method` | "Migrado do WooCommerce" |

---

## 🚨 Solução de Problemas

### **Erro: "Cannot connect to database"**

**Causa:** Credenciais incorretas ou banco não existe

**Solução:**
```bash
# Teste conexão WooCommerce
mysql -u root -p -h localhost local

# Teste conexão Gourmet Saudável
mysql -u root -p -h localhost gourmet_saudavel

# Verifique .env
cat .env | grep DB
```

---

### **Erro: "Data too long for column"**

**Causa:** Colunas ainda são `BLOB` ou `VARCHAR` curto

**Solução:**
```bash
# Execute script de alteração de colunas
mysql -u root -p gourmet_saudavel < scripts/01-alter-columns-for-encryption.sql
```

---

### **Erro: "Duplicate entry for key 'email'"**

**Causa:** Usuário já existe no destino

**Solução:** Normal! O script pula automaticamente. Verifique o resumo final.

---

### **Muitos Erros Durante Migração**

**Causa:** Dados inconsistentes no WooCommerce

**Solução:**
```sql
-- Verifique usuários sem email
SELECT COUNT(*) FROM wp_users WHERE user_email = '';

-- Verifique clientes sem dados
SELECT COUNT(*) FROM wp_wc_customer_lookup WHERE email = '';
```

---

## 📊 Limitações

### **Pedidos Históricos**

- Migra apenas metadados básicos (total, status, data)
- **NÃO migra:** itens do pedido, produtos, quantidades
- Serve apenas para histórico/referência

### **Produtos**

- **NÃO são migrados** automaticamente
- Devem ser recadastrados no novo sistema
- Estrutura completamente diferente (pratos, tamanhos, acompanhamentos)

### **Senhas**

- **NÃO são migradas** (hash incompatível)
- Usuários devem usar "Esqueci minha senha" no primeiro acesso

---

## ✅ Checklist de Migração

- [ ] Backup do WooCommerce criado
- [ ] Backup do Gourmet Saudável criado
- [ ] Colunas alteradas para TEXT (script SQL executado)
- [ ] `.env` configurado com credenciais corretas
- [ ] `ENCRYPTION_KEY` gerada e configurada
- [ ] Script de migração executado
- [ ] Registros verificados no banco
- [ ] Criptografia verificada (campos com ~100+ chars)
- [ ] Login testado com usuário migrado
- [ ] Produtos recadastrados manualmente

---

## 📚 Arquivos Relacionados

- [scripts/migrate-woocommerce-to-gourmet.ts](./scripts/migrate-woocommerce-to-gourmet.ts) - Script de migração
- [scripts/01-alter-columns-for-encryption.sql](./scripts/01-alter-columns-for-encryption.sql) - Alteração de colunas
- [ENCRYPTION.md](./ENCRYPTION.md) - Documentação de criptografia
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migração de dados existentes

---

**Última atualização:** 09 de Dezembro de 2024  
**Versão:** 1.0.0
