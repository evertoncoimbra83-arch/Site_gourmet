# Documentação de Criptografia de Dados Pessoais (PII)

Este documento descreve os padrões de segurança implementados para a proteção de Informações Pessoais Identificáveis (PII) dentro do ecossistema Gourmet.

## 1. Algoritmo de Criptografia
O sistema utiliza o algoritmo **AES-256-GCM** (Advanced Encryption Standard com Galois/Counter Mode). Este modo é escolhido por oferecer tanto **confidencialidade** quanto **autenticidade** (através de tags de verificação).

### Formato de Armazenamento
Os dados são armazenados no banco de dados como uma string única composta por três partes hexadecimais separadas por dois pontos (`:`):
`IV : AUTH_TAG : ENCRYPTED_CONTENT`

* **IV (12 bytes):** Vetor de inicialização aleatório para cada registro.
* **Auth Tag (16 bytes):** Tag gerada pelo modo GCM para garantir que o dado não foi alterado.
* **Encrypted Content:** O dado sensível transformado em cifra hexadecimal.

## 2. Gerenciamento de Chaves
A segurança depende da variável de ambiente `DB_ENCRYPTION_KEY` definida no arquivo `.env`.

Para garantir que a chave tenha sempre 32 bytes (256 bits), o sistema utiliza a função de derivação de chave **scrypt**:
- **Salt estático:** `static-salt`
- **Output:** 32 bytes binários.

## 3. Hashing para Busca (PII Hashing)
Como dados criptografados com IVs aleatórios não podem ser indexados ou buscados via SQL convencional (`WHERE document = '...'`), utilizamos uma estratégia de **Shadow Hashing**:

Cada campo sensível possui uma coluna de hash correspondente (ex: `customer_document_hash`).
- **Algoritmo:** SHA-256.
- **Salt/Pepper:** Utiliza a variável `PII_PEPPER` do `.env`.
- **Lógica:** `sha256(PII_PEPPER + ":" + dados_limpos_apenas_numeros)`.



## 4. Campos Protegidos
Atualmente, as seguintes tabelas e colunas aplicam estas regras:

| Tabela | Coluna | Tipo no Schema | Observação |
| :--- | :--- | :--- | :--- |
| `users` | `name` | `text`* | Encriptado via código na migração |
| `users` | `customer_document` | `encryptedText` | Encriptação automática via Drizzle |
| `users` | `phone` | `encryptedText` | Encriptação automática via Drizzle |
| `user_addresses` | `street`, `number`, etc | `encryptedText` | Proteção total de endereço |

*\*Nota: No schema atual, a coluna 'name' está como text, mas os dados nela contidos seguem o padrão de criptografia manual para compatibilidade com o front-end.*

## 5. Procedimento de Migração
Para importar dados de sistemas legados (ex: WordPress):
1. Limpar caracteres não numéricos de CPFs e Telefones.
2. Gerar o PII Hash com o Pepper correto.
3. Inserir os dados permitindo que o Drizzle ORM realize a encriptação ou fornecendo o dado já encriptado no formato `iv:tag:hex`.  