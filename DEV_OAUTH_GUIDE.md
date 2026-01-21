# 🔐 Guia de Dev OAuth - Autenticação Local

## 📋 O Que É?

**Dev OAuth** é um sistema de autenticação local para desenvolvimento que simula o OAuth Manus sem precisar do servidor real.

**Perfeito para:**
- ✅ Testar localmente
- ✅ Desenvolver sem internet
- ✅ Não precisa de credenciais do Manus
- ✅ Rápido e simples

**NUNCA use em produção!**

---

## 🚀 Como Usar

### Passo 1: Configurar Variáveis de Ambiente

**Opção A: Usar arquivo `.env.local` (Recomendado)**

Já existe um arquivo `.env.local` pronto:

```bash
VITE_OAUTH_PORTAL_URL=http://localhost:3000/api/dev-oauth
VITE_APP_ID=gourmet-saudavel-dev
```

**Opção B: Editar `.env` manualmente**

Se preferir editar `.env`, mude:

```env
# De:
VITE_OAUTH_PORTAL_URL=http://localhost:3000
OAUTH_SERVER_URL=http://localhost:3000

# Para:
VITE_OAUTH_PORTAL_URL=http://localhost:3000/api/dev-oauth
OAUTH_SERVER_URL=http://localhost:3000/api/dev-oauth
```

### Passo 2: Reiniciar Servidor

```bash
npm run dev
```

Você deve ver:

```
✨ Dev OAuth ativado em /api/dev-oauth
```

### Passo 3: Testar Login

1. Abra http://localhost:3000/
2. Clique em "Entrar"
3. Você será redirecionado para a página de seleção de usuário
4. Selecione um usuário:
   - **Usuário Teste** (role: user)
   - **Admin Teste** (role: admin)
5. Você será autenticado e redirecionado para home

---

## 👥 Usuários Disponíveis

### 1. Usuário Teste
- **Nome:** Usuário Teste
- **Email:** user@test.com
- **Role:** user
- **Permissões:** Acesso a funcionalidades normais

### 2. Admin Teste
- **Nome:** Admin Teste
- **Email:** admin@test.com
- **Role:** admin
- **Permissões:** Acesso ao painel administrativo

---

## 🔄 Fluxo de Autenticação

```
1. Usuário clica "Entrar"
   ↓
2. Redireciona para /api/dev-oauth/login
   ↓
3. Mostra página de seleção de usuário
   ↓
4. Usuário seleciona um usuário
   ↓
5. Redireciona para /api/dev-oauth/callback
   ↓
6. Backend cria sessão
   ↓
7. Redireciona para home
   ↓
8. Frontend detecta autenticação
```

---

## 📁 Arquivos Envolvidos

### Backend
- **`server/_core/dev-oauth.ts`** - Implementação do Dev OAuth
- **`server/_core/index.ts`** - Registra as rotas

### Frontend
- **`client/src/const.ts`** - Função `getLoginUrl()` que constrói a URL
- **`client/src/pages/Login.tsx`** - Página de login
- **`client/src/_core/hooks/useAuth.ts`** - Hook de autenticação

---

## 🔍 Troubleshooting

### Problema: Página de seleção de usuário não aparece

**Solução:**
1. Verifique se `VITE_OAUTH_PORTAL_URL=http://localhost:3000/api/dev-oauth`
2. Reinicie o servidor: `npm run dev`
3. Limpe cache do navegador: Ctrl+Shift+Delete

### Problema: Erro "Invalid user code"

**Solução:**
1. Verifique se selecionou um usuário válido
2. Verifique se o servidor está rodando
3. Veja os logs do servidor

### Problema: Login não funciona

**Solução:**
1. Abra DevTools (F12)
2. Vá em Console
3. Procure por erros
4. Verifique se o banco de dados está conectado

---

## 🔐 Segurança

### Em Desenvolvimento
- ✅ Seguro para testar localmente
- ✅ Sem exposição de credenciais reais
- ✅ Não afeta dados de produção

### Em Produção
- ❌ **NUNCA use Dev OAuth**
- ❌ Configure OAuth real do Manus
- ❌ Use variáveis de ambiente seguras

---

## 🔄 Mudar para OAuth Real

Quando quiser usar OAuth real do Manus:

1. **Obtenha as credenciais do Manus:**
   - URL do OAuth Portal
   - URL do API Server
   - App ID

2. **Atualize `.env`:**
   ```env
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_APP_ID=seu_app_id_real
   ```

3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

---

## 📊 Dados Criados

Quando você faz login com Dev OAuth:

1. **Usuário é criado no banco** (se não existir)
2. **Sessão é criada** com cookie
3. **Dados salvos:**
   - openId
   - name
   - email
   - role
   - loginMethod: "dev-oauth"
   - timestamps

---

## 🎯 Casos de Uso

### Desenvolvimento
```
Dev OAuth é perfeito para:
- Testar fluxos de autenticação
- Desenvolver sem internet
- Testar diferentes roles (user/admin)
- Trabalhar offline
```

### Testes
```
Use Dev OAuth para:
- Testes automatizados
- Testes de integração
- Testes E2E
- Testes de permissões
```

### Produção
```
NÃO use Dev OAuth para:
- Produção
- Staging
- Qualquer ambiente público
```

---

## 📝 Notas

- Dev OAuth só funciona em `NODE_ENV=development`
- Em produção, as rotas de Dev OAuth não são registradas
- Cada login cria/atualiza um usuário no banco
- A sessão dura 1 ano (pode ser alterado)

---

## 🚀 Próximos Passos

Depois de testar com Dev OAuth:

1. **Obtenha credenciais reais do Manus**
2. **Configure OAuth real**
3. **Teste com usuários reais**
4. **Deploy para produção**

---

**Última atualização:** 2024-12-01  
**Versão:** 1.0  
**Status:** ✅ Pronto para usar
