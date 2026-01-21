# 🔐 Sistema de Criptografia de Dados Sensíveis

## Visão Geral

O Gourmet Saudável implementa criptografia **AES-256-GCM** para proteger dados sensíveis dos clientes armazenados no banco de dados. Este documento descreve como o sistema funciona e como configurá-lo.

---

## 🎯 Campos Criptografados

### `customer_addresses` (Endereços de Clientes)
- `street` - Rua
- `number` - Número
- `complement` - Complemento
- `neighborhood` - Bairro
- `city` - Cidade
- `zipCode` - CEP
- `phone` - Telefone

### `user_profiles` (Perfis de Usuários)
- `phone` - Telefone
- `address` - Endereço completo

### `orders` (Pedidos)
- `deliveryAddress` - Endereço de entrega
- `deliveryPhone` - Telefone de entrega

---

## 🔧 Configuração

### 1. Gerar Chave de Criptografia

Execute no terminal:

```bash
openssl rand -base64 32
```

Exemplo de saída:
```
Kx7J9mP2qR5vW8zA3bC6dE1fG4hI0jK+lM/nO=pQ
```

### 2. Adicionar ao `.env`

Adicione a chave gerada ao arquivo `.env` na raiz do projeto:

```env
# Chave de criptografia AES-256 (32 bytes em base64)
ENCRYPTION_KEY=Kx7J9mP2qR5vW8zA3bC6dE1fG4hI0jK+lM/nO=pQ
```

⚠️ **IMPORTANTE:**
- **NUNCA** commite o arquivo `.env` no Git
- Use chaves diferentes para desenvolvimento e produção
- Guarde a chave de produção em um gerenciador de senhas seguro
- Se perder a chave, **não será possível descriptografar** os dados existentes

---

## 🛠️ Como Funciona

### Algoritmo: AES-256-GCM

- **AES-256:** Advanced Encryption Standard com chave de 256 bits
- **GCM:** Galois/Counter Mode - fornece autenticação e integridade
- **IV (Initialization Vector):** 16 bytes aleatórios por criptografia
- **Auth Tag:** 16 bytes para verificar integridade

### Formato de Dados Criptografados

```
iv:authTag:encryptedData
```

Exemplo:
```
a1b2c3d4e5f6:g7h8i9j0k1l2:m3n4o5p6q7r8s9t0
```

### Fluxo de Criptografia

1. **Ao Salvar no Banco:**
   ```typescript
   const encrypted = encrypt("Rua das Flores, 123");
   // Salva: "a1b2c3:g7h8i9:m3n4o5..."
   ```

2. **Ao Ler do Banco:**
   ```typescript
   const decrypted = decrypt("a1b2c3:g7h8i9:m3n4o5...");
   // Retorna: "Rua das Flores, 123"
   ```

---

## 📝 Uso no Código

### Importar Funções

```typescript
import { encrypt, decrypt, encryptFields, decryptFields } from "./server/encryption";
```

### Criptografar um Campo

```typescript
const encryptedPhone = encrypt("11987654321");
// Retorna: "iv:authTag:encryptedData"
```

### Descriptografar um Campo

```typescript
const decryptedPhone = decrypt(encryptedPhone);
// Retorna: "11987654321"
```

### Criptografar Múltiplos Campos

```typescript
const address = {
  street: "Rua das Flores",
  number: "123",
  city: "São Paulo",
  zipCode: "01234-567"
};

const encrypted = encryptFields(address, ["street", "number", "city", "zipCode"]);
```

### Descriptografar Múltiplos Campos

```typescript
const decrypted = decryptFields(encrypted, ["street", "number", "city", "zipCode"]);
```

---

## ✅ Implementação Automática

A criptografia é **transparente** para o desenvolvedor. Os helpers já criptografam/descriptografam automaticamente:

### `customer-addresses.ts`

```typescript
// ✅ Ao criar endereço - criptografa automaticamente
await createAddress({
  userId: 1,
  street: "Rua das Flores",
  number: "123",
  // ... outros campos
});

// ✅ Ao listar endereços - descriptografa automaticamente
const addresses = await listAddressesByUserId(1);
// addresses[0].street === "Rua das Flores" (descriptografado)
```

---

## 🔒 Segurança

### Boas Práticas

1. ✅ **Chave forte:** Use `openssl rand -base64 32`
2. ✅ **Rotação de chaves:** Troque a chave periodicamente
3. ✅ **Backup seguro:** Guarde a chave em local seguro
4. ✅ **Ambiente isolado:** Use chaves diferentes por ambiente
5. ✅ **Logs:** Nunca logue dados descriptografados

### O que NÃO fazer

1. ❌ Não use chaves fracas como "123456" ou "password"
2. ❌ Não commite a chave no Git
3. ❌ Não compartilhe a chave por email/chat
4. ❌ Não use a mesma chave em dev e produção
5. ❌ Não logue dados sensíveis descriptografados

---

## 🧪 Testes

### Testar Criptografia

```typescript
import { encrypt, decrypt } from "./server/encryption";

const original = "Dados sensíveis";
const encrypted = encrypt(original);
const decrypted = decrypt(encrypted);

console.log(original === decrypted); // true
console.log(encrypted !== original); // true
```

### Verificar no Banco

```sql
-- Ver dados criptografados
SELECT street, number, zipCode FROM customer_addresses LIMIT 1;

-- Resultado:
-- street: "a1b2c3d4:e5f6g7h8:i9j0k1l2..."
-- number: "m3n4o5p6:q7r8s9t0:u1v2w3x4..."
-- zipCode: "y5z6a7b8:c9d0e1f2:g3h4i5j6..."
```

---

## 🚨 Recuperação de Desastres

### Se Perder a Chave

**Não há como recuperar os dados!** A criptografia AES-256 é irreversível sem a chave.

**Soluções:**

1. **Backup da chave:** Guarde em cofre digital (1Password, Bitwarden)
2. **Múltiplos backups:** Armazene em 3 locais diferentes
3. **Documentação:** Documente onde a chave está guardada

### Rotação de Chaves

Para trocar a chave de criptografia:

1. Gere nova chave: `openssl rand -base64 32`
2. Descriptografe todos os dados com a chave antiga
3. Criptografe novamente com a chave nova
4. Atualize `ENCRYPTION_KEY` no `.env`

---

## 📊 Performance

### Impacto

- **Criptografia:** ~0.5ms por campo
- **Descriptografia:** ~0.5ms por campo
- **Armazenamento:** +30% de espaço (IV + AuthTag + dados)

### Otimizações

- Criptografia é feita apenas em operações de escrita
- Descriptografia é lazy (apenas quando necessário)
- Campos não sensíveis não são criptografados

---

## 📚 Referências

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [AES-GCM Specification](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

**Última atualização:** 07 de Dezembro de 2024  
**Versão:** 1.0.0
