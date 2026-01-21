# 🔄 Guia de Migração: Criptografia de Dados Existentes

Este guia explica como migrar dados existentes no banco de dados para o novo sistema de criptografia AES-256-GCM.

---

## ⚠️ ANTES DE COMEÇAR

### 1. **Faça Backup do Banco de Dados**

```bash
# Backup completo
mysqldump -u usuario -p gourmet_saudavel > backup_antes_criptografia.sql

# Ou backup apenas das tabelas afetadas
mysqldump -u usuario -p gourmet_saudavel \
  customer_addresses user_profiles \
  > backup_tabelas_sensiveis.sql
```

### 2. **Configure a Chave de Criptografia**

```bash
# Gere uma chave segura
openssl rand -base64 32
```

Adicione ao `.env`:
```env
ENCRYPTION_KEY=sua_chave_gerada_aqui
```

⚠️ **IMPORTANTE:** Guarde esta chave em local seguro! Sem ela, não será possível descriptografar os dados.

---

## 📋 Processo de Migração

### **Passo 1: Alterar Tipos de Colunas**

Execute o script SQL para alterar `BLOB` → `TEXT`:

```bash
mysql -u usuario -p gourmet_saudavel < scripts/01-alter-columns-for-encryption.sql
```

**O que este script faz:**
- Altera `customer_document` de `BLOB` para `TEXT`
- Altera outros campos sensíveis para `TEXT` ou `VARCHAR`
- Adiciona comentários indicando campos criptografados

**Tempo estimado:** ~5 segundos

---

### **Passo 2: Criptografar Dados Existentes**

Execute o script TypeScript de migração:

```bash
cd gourmet_saudavel
pnpm tsx scripts/migrate-encrypt-existing-data.ts
```

**O que este script faz:**
1. Verifica se `ENCRYPTION_KEY` está configurada
2. Busca todos os registros de `customer_addresses` e `user_profiles`
3. Identifica campos que ainda não estão criptografados
4. Criptografa cada campo sensível
5. Atualiza os registros no banco
6. Exibe relatório de progresso

**Tempo estimado:** 
- 100 registros: ~10 segundos
- 1.000 registros: ~1 minuto
- 10.000 registros: ~10 minutos

**Saída esperada:**
```
🔐 Iniciando migração de criptografia...

✅ ENCRYPTION_KEY configurada
⚠️  IMPORTANTE: Certifique-se de ter feito backup do banco!

   Iniciando em 3 segundos... (Ctrl+C para cancelar)

🏠 Migrando customer_addresses...
   Encontrados 150 endereços
   ✅ Endereço #1 criptografado
   ✅ Endereço #2 criptografado
   ...
   ✅ Concluído: 150 criptografados, 0 já estavam criptografados

👤 Migrando user_profiles...
   Encontrados 435 perfis
   ✅ Perfil #1 (userId: 1) criptografado
   ✅ Perfil #2 (userId: 2) criptografado
   ...
   ✅ Concluído: 435 criptografados, 0 já estavam criptografados

============================================================
📊 RESUMO DA MIGRAÇÃO
============================================================

🏠 Customer Addresses:
   Total: 150
   Criptografados: 150
   Já criptografados: 0

👤 User Profiles:
   Total: 435
   Criptografados: 435
   Já criptografados: 0

============================================================
✅ Migração concluída com sucesso!
============================================================
```

---

### **Passo 3: Verificar Migração**

Execute consultas SQL para verificar:

```sql
-- Ver exemplo de dado criptografado
SELECT 
  id,
  LENGTH(customer_document) as tamanho,
  LEFT(customer_document, 50) as preview
FROM user_profiles 
WHERE customer_document IS NOT NULL 
LIMIT 5;

-- Resultado esperado:
-- tamanho: ~100-200 caracteres
-- preview: "a1b2c3d4e5f6g7h8:i9j0k1l2m3n4o5p6:q7r8s9t0..."
```

---

## 🔄 Executar Novamente (Seguro)

O script de migração é **idempotente** - pode ser executado múltiplas vezes sem problemas:

- Detecta automaticamente campos já criptografados
- Pula registros que já foram processados
- Criptografa apenas dados novos ou não criptografados

```bash
# Pode executar quantas vezes quiser
pnpm tsx scripts/migrate-encrypt-existing-data.ts
```

---

## 🚨 Solução de Problemas

### Erro: "ENCRYPTION_KEY não está configurada"

**Causa:** Variável de ambiente não encontrada

**Solução:**
```bash
# Verifique se o .env existe
cat .env | grep ENCRYPTION_KEY

# Se não existir, adicione
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
```

---

### Erro: "Database not available"

**Causa:** Conexão com banco falhou

**Solução:**
```bash
# Verifique DATABASE_URL no .env
cat .env | grep DATABASE_URL

# Teste conexão
mysql -u usuario -p -h localhost gourmet_saudavel
```

---

### Erro: "Data too long for column"

**Causa:** Coluna ainda é `VARCHAR(20)` ou `BLOB`

**Solução:**
```bash
# Execute novamente o script de alteração de colunas
mysql -u usuario -p gourmet_saudavel < scripts/01-alter-columns-for-encryption.sql
```

---

### Dados Ficaram Ilegíveis

**Causa:** Criptografia aplicada, mas chave perdida ou trocada

**Solução:**
```bash
# Restaure do backup
mysql -u usuario -p gourmet_saudavel < backup_antes_criptografia.sql

# Use a chave correta e execute novamente
```

---

## 📊 Impacto da Criptografia

### Tamanho dos Dados

| Campo Original | Tamanho Antes | Tamanho Depois | Aumento |
|----------------|---------------|----------------|---------|
| CPF: "123.456.789-00" | 14 bytes | ~120 bytes | +750% |
| Telefone: "(11) 98765-4321" | 16 bytes | ~130 bytes | +710% |
| CEP: "01234-567" | 9 bytes | ~110 bytes | +1120% |
| Endereço: "Rua das Flores, 123" | 22 bytes | ~140 bytes | +536% |

**Aumento médio:** ~600-800%

### Performance

| Operação | Antes | Depois | Impacto |
|----------|-------|--------|---------|
| INSERT | 1ms | 1.5ms | +50% |
| SELECT | 1ms | 1.5ms | +50% |
| UPDATE | 1ms | 2ms | +100% |

**Impacto geral:** Mínimo para aplicações normais

---

## ✅ Checklist de Migração

- [ ] Backup do banco criado
- [ ] `ENCRYPTION_KEY` gerada e salva
- [ ] `ENCRYPTION_KEY` adicionada ao `.env`
- [ ] Script SQL de alteração de colunas executado
- [ ] Script TypeScript de migração executado
- [ ] Verificação de dados criptografados realizada
- [ ] Aplicação testada (login, cadastro, checkout)
- [ ] Backup da chave guardado em local seguro

---

## 📚 Referências

- [ENCRYPTION.md](./ENCRYPTION.md) - Documentação completa do sistema de criptografia
- [server/encryption.ts](./server/encryption.ts) - Código-fonte da criptografia
- [scripts/migrate-encrypt-existing-data.ts](./scripts/migrate-encrypt-existing-data.ts) - Script de migração

---

**Última atualização:** 07 de Dezembro de 2024  
**Versão:** 1.0.0
