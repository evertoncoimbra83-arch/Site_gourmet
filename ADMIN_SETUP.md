# 👤 Guia de Criação de Usuário Admin

## 🎯 Objetivo

Criar um usuário com permissão de **admin** para acessar o painel administrativo.

---

## 📋 Opção 1: Via phpMyAdmin (Mais Fácil)

### Passo 1: Acessar phpMyAdmin
1. Vá para o painel de controle do seu hosting
2. Clique em **phpMyAdmin**
3. Selecione seu banco de dados

### Passo 2: Acessar a tabela `users`
1. Na esquerda, clique em **users**
2. Clique em **Inserir** (ou Insert)

### Passo 3: Preencher os dados
Preencha os seguintes campos:

| Campo | Valor | Exemplo |
|-------|-------|---------|
| `openId` | ID único (obrigatório) | `user-admin-001` |
| `name` | Nome completo | `João Admin` |
| `email` | Email | `admin@gourmetsaudavel.com` |
| `role` | **admin** | `admin` |
| `loginMethod` | Método de login | `manual` |
| `createdAt` | Data/hora atual | `2024-12-01 14:30:00` |
| `updated_at` | Data/hora atual | `2024-12-01 14:30:00` |
| `lastSignedIn` | Data/hora atual | `2024-12-01 14:30:00` |

### Passo 4: Salvar
Clique em **Executar** ou **Go**

✅ **Pronto!** O usuário admin foi criado.

---

## 📋 Opção 2: Via SQL Direto (Mais Rápido)

### Passo 1: Abrir phpMyAdmin
1. Acesse phpMyAdmin
2. Clique em **SQL** (no topo)

### Passo 2: Executar Query
Cole e execute este comando:

```sql
INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updated_at, lastSignedIn)
VALUES (
  'admin-001',
  'Seu Nome',
  'seu-email@example.com',
  'admin',
  'manual',
  NOW(),
  NOW(),
  NOW()
);
```

**Customize:**
- `admin-001` → ID único
- `Seu Nome` → Seu nome completo
- `seu-email@example.com` → Seu email

✅ **Pronto!** O usuário foi criado.

---

## 📋 Opção 3: Via Script Node (Automático)

### Passo 1: Instalar dependência
```bash
npm install mysql2
```

### Passo 2: Executar script
```bash
node scripts/create-admin-user.mjs
```

### Passo 3: Responder às perguntas
```
Host do banco (padrão: localhost): localhost
Usuário do banco (padrão: root): seu_usuario
Senha do banco: sua_senha
Nome do banco (padrão: gourmet_saudavel): gourmet_saudavel
OpenId (identificador único, ex: user-123): admin-001
Nome completo: Seu Nome
Email: seu-email@example.com
```

✅ **Pronto!** O usuário foi criado automaticamente.

---

## 🔐 Próximo Passo: Fazer Login

### 1. Abra o navegador
```
http://localhost:3000/
```

### 2. Clique em "Login"
Você será redirecionado para a página de login do Manus OAuth.

### 3. Faça login com sua conta
Use a conta associada ao email que você cadastrou.

### 4. Você será redirecionado de volta
O sistema vai criar/atualizar seu usuário automaticamente.

### 5. Acesse o admin
```
http://localhost:3000/admin
```

---

## ⚠️ Problemas Comuns

### Problema: "Usuário não consegue acessar admin"
**Solução:** Verifique se o `role` está definido como `admin` na tabela `users`.

```sql
SELECT openId, name, role FROM users WHERE email = 'seu-email@example.com';
```

Se o role for `user`, atualize:
```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@example.com';
```

### Problema: "OpenId não bate"
**Solução:** O `openId` é fornecido pelo Manus OAuth. Se não bater, o usuário não será encontrado.

Você pode:
1. Deletar o usuário criado manualmente
2. Fazer login normalmente
3. Depois atualizar o role para admin via SQL

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@example.com';
```

### Problema: "Erro de conexão ao banco"
**Solução:** Verifique:
- Host correto (localhost, IP, ou domínio)
- Usuário e senha corretos
- Nome do banco correto
- Banco está online

---

## 📊 Verificar Usuários Criados

Para ver todos os usuários admin:

```sql
SELECT id, openId, name, email, role FROM users WHERE role = 'admin';
```

Para ver todos os usuários:

```sql
SELECT id, openId, name, email, role FROM users;
```

---

## 🔒 Segurança

### ✅ Boas Práticas
- Use um email real (você receberá notificações)
- Use um OpenId único e fácil de lembrar
- Guarde bem suas credenciais
- Não compartilhe o OpenId

### ❌ Não Faça
- Não crie múltiplos admins desnecessariamente
- Não use senhas fracas
- Não compartilhe credenciais
- Não deixe o banco de dados exposto

---

## 📚 Próximos Passos

Depois de criar o usuário admin:

1. ✅ Fazer login
2. ✅ Acessar `/admin`
3. ✅ Gerenciar pratos, tamanhos, acompanhamentos
4. ✅ Visualizar pedidos
5. ✅ Gerenciar usuários

---

**Dúvidas?** Consulte o arquivo `SECURITY.md` para mais informações sobre autenticação.
