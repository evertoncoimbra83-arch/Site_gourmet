# Resolução de Problemas: Migração

## Erros Comuns e Soluções

### 1. RangeError: Invalid key length
- **Causa:** O Node.js exige que a chave AES-256 tenha exatamente 32 bytes.
- **Solução:** Aplicar `createHash("sha256").update(RAW_KEY).digest()` na chave do `.env` antes de usá-la no `createCipheriv`.

### 2. ER_DUP_ENTRY (E-mail Duplicado)
- **Causa:** Tentativa de importar um e-mail que já existe em uma tabela com restrição `UNIQUE`.
- **Solução:** Usar a cláusula `.onDuplicateKeyUpdate()` do Drizzle ou rodar o script de `resetClients` antes da nova importação.

### 3. Criptografia Dupla (Double Encryption)
- **Causa:** Enviar dados já encriptados para colunas do tipo `encryptedText` que já possuem middleware de encriptação.
- **Solução:** - Para colunas `text`: Encriptar manualmente.
    - Para colunas `encryptedText`: Enviar texto limpo (o Drizzle encripta).

### 4. ERR_MODULE_NOT_FOUND (trpc.js)
- **Causa:** Importação circular. O Schema do Drizzle tentou importar o servidor tRPC.
- **Solução:** Manter os schemas "puros". Importar apenas tipos do Drizzle e utilitários de criptografia que não dependam do contexto do servidor.