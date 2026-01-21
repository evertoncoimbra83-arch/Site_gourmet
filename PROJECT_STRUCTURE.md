# 📐 Estrutura do Projeto - Gourmet Saudável

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Componentes Principais](#componentes-principais)
5. [Fluxos de Dados](#fluxos-de-dados)
6. [Banco de Dados](#banco-de-dados)
7. [Segurança](#segurança)
8. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

**Gourmet Saudável** é uma plataforma de e-commerce para venda de refeições saudáveis com:

- ✅ Catálogo de produtos (pratos)
- ✅ Sistema de pacotes mensais personalizáveis
- ✅ Carrinho de compras
- ✅ Múltiplos métodos de pagamento
- ✅ Programa de fidelidade com pontos
- ✅ Painel administrativo completo
- ✅ Autenticação OAuth Manus
- ✅ Histórico de pedidos antigos (WordPress)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                      │
│  Vite + Tailwind CSS 4 + shadcn/ui + wouter (routing)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP/tRPC (JSON)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  BACKEND (Express + tRPC)                    │
│  Node.js + Express 4 + tRPC 11 + Drizzle ORM                │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   MySQL/TiDB          OAuth Manus          S3 Storage
   (Banco Local)       (Autenticação)      (Arquivos)
```

---

## 📁 Estrutura de Pastas

```
gourmet_saudavel/
├── client/                          # Frontend React
│   ├── public/                      # Assets estáticos
│   │   └── (imagens, ícones, etc)
│   ├── src/
│   │   ├── _core/                   # Lógica compartilhada
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts       # Hook de autenticação
│   │   │   │   ├── useCart.ts       # Hook de carrinho
│   │   │   │   └── useLocalStorage.ts
│   │   │   ├── contexts/
│   │   │   │   └── ThemeContext.tsx # Contexto de tema
│   │   │   └── utils/
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── Header.tsx           # Navegação principal
│   │   │   ├── Footer.tsx           # Rodapé
│   │   │   ├── ProtectedRoute.tsx   # Proteção de rotas
│   │   │   ├── AdminLayout.tsx      # Layout do admin
│   │   │   ├── ProductCard.tsx      # Card de produto
│   │   │   ├── CartSummary.tsx      # Resumo do carrinho
│   │   │   └── ...
│   │   ├── pages/                   # Páginas (rotas)
│   │   │   ├── Home.tsx             # Página inicial
│   │   │   ├── Products.tsx         # Catálogo de produtos
│   │   │   ├── Packages.tsx         # Pacotes mensais
│   │   │   ├── CartPage.tsx         # Carrinho
│   │   │   ├── Login.tsx            # Login com OAuth
│   │   │   ├── AdminDashboard.tsx   # Dashboard admin
│   │   │   ├── AdminDishes.tsx      # Gerenciar pratos
│   │   │   ├── AdminPackages.tsx    # Gerenciar pacotes
│   │   │   ├── AdminOrders.tsx      # Gerenciar pedidos
│   │   │   ├── AdminUsers.tsx       # Gerenciar usuários
│   │   │   ├── AdminLoyalty.tsx     # Gerenciar pontos
│   │   │   ├── AdminCSVOrders.tsx   # Pedidos antigos (CSV)
│   │   │   └── NotFound.tsx         # 404
│   │   ├── lib/
│   │   │   ├── trpc.ts              # Cliente tRPC
│   │   │   └── utils.ts             # Funções utilitárias
│   │   ├── const.ts                 # Constantes
│   │   ├── App.tsx                  # Roteamento principal
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Estilos globais
│   └── index.html                   # HTML base
│
├── server/                          # Backend Node.js
│   ├── _core/                       # Núcleo do servidor
│   │   ├── index.ts                 # Servidor Express
│   │   ├── context.ts               # Contexto tRPC (autenticação)
│   │   ├── trpc.ts                  # Configuração tRPC
│   │   ├── oauth.ts                 # Fluxo OAuth Manus
│   │   ├── cookies.ts               # Gerenciamento de cookies
│   │   ├── env.ts                   # Variáveis de ambiente
│   │   ├── security-middleware.ts   # Middlewares de segurança
│   │   ├── llm.ts                   # Integração com LLM
│   │   ├── voiceTranscription.ts    # Transcrição de áudio
│   │   ├── imageGeneration.ts       # Geração de imagens
│   │   ├── map.ts                   # Integração com Google Maps
│   │   ├── notification.ts          # Sistema de notificações
│   │   └── systemRouter.ts          # Rotas de sistema
│   ├── db.ts                        # Helpers de banco de dados
│   ├── routers.ts                   # Routers tRPC
│   ├── csv-orders-parser.ts         # Parser de pedidos CSV
│   ├── csv-orders-router.ts         # Router para pedidos CSV
│   ├── legacy-orders.ts             # Helpers para pedidos antigos
│   ├── legacy-orders-router.ts      # Router para pedidos antigos
│   ├── admin-sizes.ts               # Gerenciar tamanhos
│   └── *.test.ts                    # Testes Vitest
│
├── drizzle/                         # Banco de Dados
│   ├── schema.ts                    # Definição de tabelas
│   └── migrations/                  # Histórico de migrações
│
├── storage/                         # Armazenamento S3
│   └── index.ts                     # Helpers de S3
│
├── shared/                          # Código compartilhado
│   └── const.ts                     # Constantes globais
│
├── scripts/                         # Scripts utilitários
│   ├── create-admin-user.mjs        # Criar usuário admin
│   ├── importar-acompanhamentos.ts  # Importar acompanhamentos
│   ├── importar-itens-pedidos.ts    # Importar itens dos pedidos
│   └── importar-acompanhamentos-v2.ts
│
├── .env                             # Variáveis de ambiente
├── .env.example                     # Template de .env
├── package.json                     # Dependências
├── tsconfig.json                    # Configuração TypeScript
├── vite.config.ts                   # Configuração Vite
├── tailwind.config.ts               # Configuração Tailwind
├── drizzle.config.ts                # Configuração Drizzle
│
├── README.md                        # Documentação principal
├── PROJECT_STRUCTURE.md             # Este arquivo
├── LOGIN_OAUTH_GUIDE.md             # Guia de login
├── SECURITY.md                      # Documentação de segurança
├── ADMIN_SETUP.md                   # Setup de admin
└── todo.md                          # Tarefas pendentes
```

---

## 🔧 Componentes Principais

### 1. **Frontend (React)**

#### Páginas Públicas
- **Home.tsx** - Landing page com apresentação
- **Products.tsx** - Catálogo de produtos com filtros
- **Packages.tsx** - Pacotes mensais personalizáveis
- **CartPage.tsx** - Carrinho de compras

#### Páginas de Admin
- **AdminDashboard.tsx** - Dashboard com estatísticas
- **AdminDishes.tsx** - CRUD de pratos
- **AdminPackages.tsx** - CRUD de pacotes
- **AdminOrders.tsx** - Gerenciar pedidos
- **AdminUsers.tsx** - Gerenciar usuários
- **AdminLoyalty.tsx** - Programa de fidelidade
- **AdminCSVOrders.tsx** - Histórico de pedidos antigos

#### Componentes Reutilizáveis
- **Header.tsx** - Navegação com login/logout
- **Footer.tsx** - Rodapé
- **ProtectedRoute.tsx** - Proteção de rotas admin
- **AdminLayout.tsx** - Layout do painel admin
- **ProductCard.tsx** - Card de produto

### 2. **Backend (Express + tRPC)**

#### Routers tRPC
```typescript
// Autenticação
trpc.auth.me           // Obter usuário atual
trpc.auth.logout       // Fazer logout

// Produtos
trpc.dishes.list       // Listar pratos
trpc.dishes.create     // Criar prato
trpc.dishes.update     // Atualizar prato
trpc.dishes.delete     // Deletar prato

// Pacotes
trpc.packages.list     // Listar pacotes
trpc.packages.create   // Criar pacote
trpc.packages.update   // Atualizar pacote
trpc.packages.delete   // Deletar pacote

// Carrinho
trpc.cart.get          // Obter carrinho
trpc.cart.add          // Adicionar item
trpc.cart.remove       // Remover item
trpc.cart.update       // Atualizar quantidade

// Pedidos
trpc.orders.list       // Listar pedidos
trpc.orders.create     // Criar pedido
trpc.orders.getById    // Obter pedido

// Fidelidade
trpc.loyalty.getPoints // Obter pontos
trpc.loyalty.redeem    // Resgatar pontos

// Pedidos Antigos (CSV)
trpc.csvOrders.list    // Listar pedidos CSV
trpc.csvOrders.getById // Obter pedido CSV
```

### 3. **Banco de Dados (MySQL/TiDB)**

#### Tabelas Principais
- **users** - Usuários do sistema
- **dishes** - Pratos/produtos
- **sizes** - Tamanhos (200g, 300g, 400g)
- **accompanimentGroups** - Grupos de acompanhamentos
- **accompanimentOptions** - Opções de acompanhamentos
- **packages** - Pacotes mensais
- **package_options** - Opções dentro de pacotes
- **orders** - Pedidos
- **orderItems** - Itens dos pedidos
- **order_item_accompaniments** - Acompanhamentos dos itens
- **loyalty_points** - Pontos de fidelidade
- **loyalty_transactions** - Histórico de transações

---

## 🔄 Fluxos de Dados

### 1. **Fluxo de Autenticação (OAuth)**

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE LOGIN OAUTH                       │
└─────────────────────────────────────────────────────────────┘

1. Usuário clica "Entrar" no Header
   ↓
2. Redireciona para getLoginUrl() que constrói:
   - URL: https://oauth.manus.im/app-auth
   - Params: appId, redirectUri, state
   ↓
3. Usuário faz login no Manus OAuth
   ↓
4. Manus redireciona para: /api/oauth/callback?code=...&state=...
   ↓
5. Backend troca code por token (exchangeCodeForToken)
   ↓
6. Backend obtém info do usuário (getUserInfo)
   ↓
7. Backend cria/atualiza usuário no banco (upsertUser)
   ↓
8. Backend cria session token (createSessionToken)
   ↓
9. Backend seta cookie de sessão (maxAge: 1 ano)
   ↓
10. Backend redireciona para / (home)
    ↓
11. Frontend detecta autenticação via useAuth()
    ↓
12. Se é admin, mostra botão "Painel Admin"
```

### 2. **Fluxo de Compra (Carrinho → Pedido)**

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE COMPRA                            │
└─────────────────────────────────────────────────────────────┘

1. Usuário navega por produtos
   ↓
2. Clica "Adicionar ao Carrinho"
   ↓
3. Item é adicionado ao localStorage (persistência)
   ↓
4. Carrinho é sincronizado com BD (se autenticado)
   ↓
5. Usuário vai para /carrinho
   ↓
6. Revisa itens e clica "Finalizar Compra"
   ↓
7. Redireciona para checkout (endereço, frete, pagamento)
   ↓
8. Seleciona método de pagamento (5 opções)
   ↓
9. Clica "Confirmar Pedido"
   ↓
10. Backend cria pedido no banco
    ↓
11. Backend calcula pontos de fidelidade
    ↓
12. Backend retorna confirmação
    ↓
13. Frontend mostra "Pedido Confirmado"
    ↓
14. Carrinho é limpo
```

### 3. **Fluxo de Pacote Personalizado**

```
┌─────────────────────────────────────────────────────────────┐
│               FLUXO DE PACOTE PERSONALIZADO                  │
└─────────────────────────────────────────────────────────────┘

1. Usuário vai para /pacotes
   ↓
2. Seleciona número de opções (1-6)
   ↓
3. Para cada opção:
   - Seleciona tamanho (200g, 300g, 400g)
   - Seleciona prato
   - Seleciona acompanhamentos (até 2)
   ↓
4. Sistema calcula preço em tempo real:
   - Preço base do prato
   - Acréscimo por tamanho (%)
   - Acréscimo por acompanhamento
   ↓
5. Usuário clica "Adicionar ao Carrinho"
   ↓
6. Pacote é adicionado com todas as configurações
   ↓
7. Usuário pode editar ou remover
```

### 4. **Fluxo de Programa de Fidelidade**

```
┌─────────────────────────────────────────────────────────────┐
│              FLUXO DE PROGRAMA DE FIDELIDADE                 │
└─────────────────────────────────────────────────────────────┘

1. Usuário faz compra
   ↓
2. Backend calcula pontos:
   - 1 ponto por R$ 1,00 gasto
   - Bônus por método de pagamento
   ↓
3. Pontos são creditados na conta
   ↓
4. Usuário pode ver saldo em /admin/loyalty
   ↓
5. Usuário pode resgatar pontos no checkout:
   - 100 pontos = R$ 10,00 de desconto
   ↓
6. Pontos são debitados
   ↓
7. Desconto é aplicado ao pedido
```

---

## 🗄️ Banco de Dados

### Diagrama de Entidades

```
users (1) ──────┐
                │
                ├─→ orders (1) ──────┐
                │                    │
                │                    ├─→ orderItems (1) ──────┐
                │                    │                         │
                │                    │                         ├─→ order_item_accompaniments
                │                    │                         │
                │                    │                         └─→ dishes
                │                    │
                │                    └─→ loyalty_transactions
                │
                └─→ loyalty_points
                
dishes (1) ──────┐
                 │
                 ├─→ package_options
                 │
                 └─→ orderItems

sizes (1) ──────┐
                │
                ├─→ size_accompaniments
                │
                └─→ orderItems

accompanimentGroups (1) ──────┐
                               │
                               ├─→ size_accompaniments
                               │
                               └─→ accompanimentOptions

packages (1) ──────→ package_options
```

### Tabelas Principais

#### **users**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

#### **dishes**
```sql
CREATE TABLE dishes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  basePrice DECIMAL(10, 2),
  image VARCHAR(500),
  category VARCHAR(100),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### **orders**
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
  totalAmount DECIMAL(10, 2),
  paymentMethod VARCHAR(50),
  pointsUsed INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## 🔐 Segurança

### Implementações de Segurança

1. **Autenticação OAuth**
   - Sem armazenamento de senhas
   - Tokens JWT com expiração
   - Cookies seguros (httpOnly, secure, sameSite)

2. **Autorização**
   - Verificação de role (admin/user)
   - ProtectedRoute para rotas sensíveis
   - Validação no backend

3. **Proteção contra Ataques**
   - CSRF protection headers
   - XSS protection (Content-Security-Policy)
   - Rate limiting em produção
   - Sanitização de inputs

4. **Logs de Segurança**
   - Falhas de autenticação
   - Acessos ao admin
   - Operações sensíveis

---

## 🚀 Próximos Passos

### Fase 1: Validação (1-2 semanas)
- [ ] Testar login OAuth com usuários reais
- [ ] Validar fluxo de compra completo
- [ ] Testar todos os métodos de pagamento
- [ ] Verificar programa de fidelidade
- [ ] Testar responsividade em mobile

### Fase 2: Integração de Dados (1-2 semanas)
- [ ] Importar produtos do WordPress
- [ ] Importar histórico de pedidos antigos
- [ ] Configurar tamanhos e acompanhamentos
- [ ] Validar dados importados
- [ ] Criar backups

### Fase 3: Melhorias de UX (2-3 semanas)
- [ ] Adicionar página de detalhes do produto
- [ ] Implementar busca com autocomplete
- [ ] Melhorar filtros de produtos
- [ ] Adicionar reviews/avaliações
- [ ] Implementar recomendações

### Fase 4: Otimizações (1-2 semanas)
- [ ] Otimizar performance (lazy loading, code splitting)
- [ ] Implementar caching
- [ ] Otimizar imagens
- [ ] Melhorar SEO
- [ ] Adicionar sitemap

### Fase 5: Produção (1 semana)
- [ ] Configurar HTTPS
- [ ] Configurar domínio customizado
- [ ] Configurar backups automáticos
- [ ] Configurar monitoramento
- [ ] Treinar equipe

---

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| Linhas de código | ~15,000+ |
| Componentes React | 30+ |
| Routers tRPC | 50+ |
| Tabelas no banco | 14 |
| Testes unitários | 66+ |
| Páginas | 15+ |
| Funcionalidades | 20+ |

---

## 🔗 Referências Rápidas

### Documentação
- [LOGIN_OAUTH_GUIDE.md](./LOGIN_OAUTH_GUIDE.md) - Guia de autenticação
- [SECURITY.md](./SECURITY.md) - Documentação de segurança
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Setup de admin
- [README.md](./README.md) - Documentação principal

### Comandos Úteis
```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento
npm run check           # Verificar tipos TypeScript
npm run test            # Rodar testes

# Banco de dados
npm run db:push         # Aplicar migrations

# Build
npm run build           # Build para produção
npm run start           # Iniciar em produção
```

### Variáveis de Ambiente
```bash
# OAuth
VITE_APP_ID=seu_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OAUTH_SERVER_URL=https://api.manus.im

# Banco de Dados
DATABASE_URL=mysql://user:password@localhost/database

# Segurança
JWT_SECRET=sua_chave_secreta

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=seu_id
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. **Verifique a documentação** - Leia os arquivos .md
2. **Verifique os logs** - Abra DevTools (F12)
3. **Teste localmente** - Execute `npm run dev`
4. **Verifique o banco** - Abra phpMyAdmin

---

**Última atualização:** 2024-12-01  
**Versão:** 1.0  
**Status:** ✅ Pronto para desenvolvimento
