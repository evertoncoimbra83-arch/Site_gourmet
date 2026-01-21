# 🚀 Guia de Instalação - Gourmet Saudável (Servidor Local)

## 📋 Pré-requisitos

Antes de instalar, certifique-se de ter instalado:

- **Node.js** versão 18 ou superior ([Download](https://nodejs.org/))
- **MySQL** versão 8.0 ou superior ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** (opcional, para controle de versão)
- **pnpm** (será instalado automaticamente via npm)

---

## 📦 Passo 1: Extrair o Projeto

1. Extraia o arquivo `gourmet_saudavel.zip` em uma pasta de sua escolha
2. Abra o terminal/prompt de comando na pasta extraída

```bash
cd /caminho/para/gourmet_saudavel
```

---

## 🗄️ Passo 2: Configurar o Banco de Dados

### 2.1 Criar o Banco de Dados

Abra o MySQL e execute:

```sql
CREATE DATABASE gourmet_saudavel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 Criar Usuário (Opcional, mas recomendado)

```sql
CREATE USER 'gourmet_user'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON gourmet_saudavel.* TO 'gourmet_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Copiar o arquivo de exemplo

```bash
cp .env.example .env
```

### 3.2 Editar o arquivo `.env`

Abra o arquivo `.env` em um editor de texto e configure:

```env
# ============ DATABASE ============
DATABASE_URL=mysql://gourmet_user:sua_senha_segura@localhost:3306/gourmet_saudavel

# ============ JWT SECRET ============
# Gere uma chave aleatória segura (use um gerador online ou comando abaixo)
JWT_SECRET=sua_chave_secreta_muito_longa_e_aleatoria_aqui

# ============ OAUTH (Manus) ============
# IMPORTANTE: Estas variáveis são específicas da plataforma Manus
# Para ambiente local, você pode desabilitar OAuth ou criar credenciais próprias
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=seu_app_id_aqui

# ============ OWNER INFO ============
OWNER_OPEN_ID=admin
OWNER_NAME=Administrador

# ============ APP CONFIG ============
VITE_APP_TITLE=Gourmet Saudável
VITE_APP_LOGO=/logo.png

# ============ S3 STORAGE (Manus Built-in) ============
# NOTA: O sistema usa o storage da Manus por padrão
# Para ambiente local, você precisará configurar seu próprio S3 ou usar alternativa
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api_aqui
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend_aqui

# ============ ANALYTICS (Opcional) ============
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# ============ WOOCOMMERCE (Opcional) ============
WOOCOMMERCE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
```

### 3.3 Gerar JWT Secret

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Ou use um gerador online:** https://generate-secret.vercel.app/32

---

## 📚 Passo 4: Instalar Dependências

```bash
# Instalar pnpm globalmente (se ainda não tiver)
npm install -g pnpm

# Instalar dependências do projeto
pnpm install
```

Este processo pode levar alguns minutos dependendo da sua conexão.

---

## 🗃️ Passo 5: Criar as Tabelas do Banco de Dados

```bash
pnpm db:push
```

Este comando irá:
- Ler o schema em `drizzle/schema.ts`
- Criar todas as tabelas necessárias
- Aplicar as configurações de índices e relações

---

## 🌱 Passo 6: Popular o Banco com Dados Iniciais (Opcional)

### 6.1 Criar usuário admin

Execute no MySQL:

```sql
USE gourmet_saudavel;

INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updated_at, lastSignedIn)
VALUES ('admin', 'Administrador', 'admin@gourmet.com', 'admin', 'local', NOW(), NOW(), NOW());
```

### 6.2 Criar métodos de pagamento com logos das bandeiras

```bash
pnpm tsx server/seed-brands.ts
```

Este script irá:
- Fazer upload dos logos das bandeiras para S3
- Criar 9 métodos de pagamento (Alelo, Ticket, VR, Pluxee, Ben, Verocard)
- Desativar o método genérico

**IMPORTANTE:** Este script requer acesso ao S3 configurado. Se você não tiver configurado o S3, pode pular esta etapa e adicionar os métodos manualmente via interface admin.

---

## 🚀 Passo 7: Iniciar o Servidor

```bash
pnpm dev
```

O servidor será iniciado em:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

---

## 🔐 Passo 8: Acessar o Sistema

### 8.1 Acesso sem OAuth (Desenvolvimento Local)

Como o sistema usa OAuth da Manus por padrão, você precisará fazer uma das seguintes opções:

**Opção A: Desabilitar autenticação temporariamente (apenas para desenvolvimento)**

Edite `server/_core/context.ts` e comente a verificação de autenticação.

**Opção B: Criar sistema de login local**

Implemente um sistema de login com email/senha (já existe o campo `password` na tabela `users`).

**Opção C: Usar credenciais Manus**

Se você tiver uma conta Manus, use as credenciais fornecidas pela plataforma.

### 8.2 Acessar como Admin

Após fazer login, acesse:
- **Painel Admin:** http://localhost:5173/admin
- **Gerenciar Pratos:** http://localhost:5173/admin/pratos
- **Métodos de Pagamento:** http://localhost:5173/admin/metodos-pagamento

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento (com hot reload)
pnpm dev

# Build para produção
pnpm build

# Iniciar em produção
pnpm start

# Executar testes
pnpm test

# Aplicar mudanças no schema
pnpm db:push

# Gerar tipos do Drizzle
pnpm drizzle-kit generate

# Verificar tipos TypeScript
pnpm type-check

# Limpar cache e reinstalar
pnpm clean
rm -rf node_modules
pnpm install
```

---

## 📁 Estrutura de Pastas

```
gourmet_saudavel/
├── client/                 # Frontend (React + Vite)
│   ├── public/            # Arquivos estáticos
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários e configurações
│   │   └── App.tsx        # Componente raiz
│   └── index.html
├── server/                 # Backend (Express + tRPC)
│   ├── _core/             # Configurações do framework
│   ├── routers.ts         # Rotas da API
│   ├── db.ts              # Funções de banco de dados
│   └── *.ts               # Módulos de funcionalidades
├── drizzle/               # Schema e migrações
│   └── schema.ts          # Definição das tabelas
├── shared/                # Código compartilhado
├── storage/               # Helpers de S3
├── assets/                # Assets do projeto (logos, etc)
├── scripts/               # Scripts utilitários
├── .env                   # Variáveis de ambiente (não versionado)
├── .env.example           # Exemplo de configuração
├── package.json           # Dependências do projeto
└── README.md              # Documentação principal
```

---

## 🔧 Configuração Avançada

### Usar Storage Local (Alternativa ao S3)

Se você não quiser usar S3, pode configurar storage local:

1. Instale o pacote `multer`:
```bash
pnpm add multer @types/multer
```

2. Crie uma pasta para uploads:
```bash
mkdir -p uploads/media-library
```

3. Edite `server/storage.ts` para usar storage local

### Configurar Porta Diferente

Edite `package.json` e adicione a variável `PORT`:

```json
{
  "scripts": {
    "dev": "PORT=8080 concurrently \"pnpm:dev:*\""
  }
}
```

---

## ❓ Problemas Comuns

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se o MySQL está rodando
2. Confirme as credenciais no `.env`
3. Teste a conexão manualmente:
```bash
mysql -u gourmet_user -p -h localhost gourmet_saudavel
```

### Erro: "Port 3000 already in use"

**Solução:**
1. Mate o processo na porta 3000:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro: "pnpm: command not found"

**Solução:**
```bash
npm install -g pnpm
```

### Erro ao fazer upload de imagens

**Solução:**
1. Verifique se as credenciais S3 estão corretas no `.env`
2. Teste a conexão com o S3
3. Considere usar storage local como alternativa

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação em `MEDIA_LIBRARY.md`
2. Consulte o `README.md` principal
3. Revise os logs do servidor no terminal
4. Verifique o console do navegador (F12)

---

## 🔒 Segurança em Produção

Antes de colocar em produção:

1. ✅ Altere todas as senhas e secrets
2. ✅ Configure HTTPS (SSL/TLS)
3. ✅ Habilite CORS apenas para domínios confiáveis
4. ✅ Configure backup automático do banco de dados
5. ✅ Implemente rate limiting
6. ✅ Configure logs de auditoria
7. ✅ Use variáveis de ambiente seguras (não commite `.env`)
8. ✅ Atualize dependências regularmente

---

**Última atualização:** 05 de Dezembro de 2024  
**Versão do Projeto:** 1.0.0  
**Node.js requerido:** ≥18.0.0
