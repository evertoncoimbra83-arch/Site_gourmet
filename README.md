# 🍱 Gourmet Saudável - E-commerce de Refeições Congeladas Fit

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-proprietary-red)

> Um e-commerce moderno, responsivo e intuitivo para venda de refeições congeladas fit com sistema de pacotes mensais customizáveis, acompanhamentos dinâmicos e programa de fidelidade.

## 🎯 Características Principais

✨ **Identidade Visual Moderna**
- Paleta de cores estratégica (Verde Esmeralda + Amarelo Dourado)
- Design responsivo mobile-first
- Grafismos e overlays criativos nas imagens de produtos

📦 **Sistema de Pacotes Mensais**
- Admin panel intuitivo para criar/editar pacotes
- Seleção dinâmica de opções (pratos)
- Acompanhamentos customizáveis por opção
- Cálculo automático de preço

⭐ **Programa de Fidelidade**
- Sistema de pontos por compra
- Resgate de pontos no checkout
- Histórico de transações

🔐 **Autenticação Segura**
- Integração com Manus OAuth
- Controle de acesso por roles (admin/user)
- Sessões persistentes

🗄️ **Banco de Dados Otimizado**
- 14 tabelas relacionadas
- Migrations automáticas com Drizzle ORM
- Suporte a MySQL/TiDB

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- pnpm (ou npm/yarn)
- Banco de dados MySQL/TiDB

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd gourmet_saudavel

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute migrations
pnpm db:push

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000`

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| **[DOCUMENTACAO.md](./DOCUMENTACAO.md)** | Documentação completa (estrutura, BD, funcionalidades) |
| **[GUIA_RAPIDO.md](./GUIA_RAPIDO.md)** | Guia de início rápido e tarefas comuns |
| **[GRAPHICS_SYSTEM.md](./GRAPHICS_SYSTEM.md)** | Sistema de grafismos e overlays |
| **[todo.md](./todo.md)** | Checklist de tarefas e progresso |

---

## 🏗️ Stack Tecnológico

### Frontend
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
- **Wouter** - Routing
- **tRPC** - Type-safe API client

### Backend
- **Node.js + Express** - Server
- **tRPC** - API framework
- **Drizzle ORM** - Database ORM
- **MySQL/TiDB** - Database

### Autenticação
- **Manus OAuth** - Social login

### Ferramentas
- **Vite** - Build tool
- **Vitest** - Testing framework
- **pnpm** - Package manager

---

## 📁 Estrutura do Projeto

```
gourmet_saudavel/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas (Home, Products, Packages)
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # Utilitários
│   │   └── index.css         # Estilos globais
│   └── public/               # Assets estáticos
│
├── server/                    # Backend Node.js
│   ├── routers.ts            # tRPC procedures
│   ├── db.ts                 # Database queries
│   ├── packages.ts           # Package helpers
│   └── _core/                # Framework core
│
├── drizzle/                   # Database schema
│   ├── schema.ts             # Tabelas
│   └── migrations/           # Histórico
│
├── DOCUMENTACAO.md           # Documentação completa
├── GUIA_RAPIDO.md           # Quick start
├── GRAPHICS_SYSTEM.md       # Grafismos
├── todo.md                  # Tarefas
└── README.md                # Este arquivo
```

---

## 🎨 Paleta de Cores

| Cor | Hex | OKLCH | Uso |
|-----|-----|-------|-----|
| Verde Esmeralda | #2D5A3D | oklch(42% 0.08 155) | Primária |
| Amarelo Dourado | #D4AF37 | oklch(75% 0.18 82) | Secundária |
| Branco | #FFFFFF | oklch(100% 0 0) | Fundo |
| Cinza Carvão | #2C2C2C | oklch(15% 0 0) | Texto |

---

## 📊 Banco de Dados

14 tabelas otimizadas para:
- Gestão de produtos (pratos)
- Pacotes mensais customizáveis
- Acompanhamentos dinâmicos
- Pedidos e histórico
- Sistema de fidelidade
- Autenticação de usuários

Veja [DOCUMENTACAO.md](./DOCUMENTACAO.md) para schema completo.

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento
pnpm build            # Build para produção
pnpm preview          # Preview do build

# Banco de dados
pnpm db:push          # Executa migrations
pnpm db:studio        # Abre Drizzle Studio

# Testes
pnpm test             # Roda todos os testes
pnpm test --watch     # Watch mode
pnpm test packages    # Testa módulo específico

# Linting
pnpm lint             # Verifica código
pnpm format           # Formata código
```

---

## 📱 Páginas Implementadas

### Públicas
- **`/`** - Home com hero section e categorias
- **`/produtos`** - Catálogo de pratos individuais
- **`/pacotes`** - Catálogo de pacotes mensais

### Admin
- **`/admin/pacotes`** - Gerenciar pacotes (criar, editar, deletar)

---

## ✅ Funcionalidades Implementadas

- [x] Nova identidade visual (Verde Esmeralda + Amarelo Dourado)
- [x] Grafismos e overlays criativos
- [x] Extração de dados do WooCommerce (123 produtos, 435 clientes)
- [x] Schema BD otimizado com 14 tabelas
- [x] Admin panel para gerenciar pacotes
- [x] Página pública de pacotes
- [x] Seletor de opções com cálculo dinâmico
- [x] Autenticação via Manus OAuth
- [x] Testes unitários (Vitest)

---

## 🚧 Em Desenvolvimento

- [ ] Seletor de acompanhamentos completo
- [ ] Carrinho funcional
- [ ] Sistema de fidelidade (pontos)
- [ ] Checkout e pagamento
- [ ] Página de detalhes do produto
- [ ] Admin dashboard com relatórios
- [ ] Notificações por email

Veja [todo.md](./todo.md) para lista completa.

---

## 🧪 Testes

```bash
# Rodar todos os testes
pnpm test

# Testes específicos
pnpm test packages
pnpm test auth

# Watch mode
pnpm test --watch
```

**Status:** 2/5 testes passando (packages.test.ts)

---

## 🔐 Variáveis de Ambiente

```env
# Database
DATABASE_URL=mysql://user:password@host/database

# WooCommerce
WOOCOMMERCE_URL=https://gourmetsaudavel.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...

# Manus OAuth
VITE_APP_ID=...
VITE_OAUTH_PORTAL_URL=...
OAUTH_SERVER_URL=...
JWT_SECRET=...

# App
VITE_APP_TITLE=Gourmet Saudável
VITE_APP_LOGO=/logo.svg
```

---

## 📈 Dados Migrados do WooCommerce

- **123 produtos** (pratos individuais)
- **435 clientes**
- **1.645 pedidos** (histórico)
- **20 categorias**

---

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -m "Add: nova funcionalidade"`
3. Push: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

---

## 📝 Licença

Propriedade de Gourmet Saudável. Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a [DOCUMENTACAO.md](./DOCUMENTACAO.md)
2. Verifique [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)
3. Confira [todo.md](./todo.md)

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ para Gourmet Saudável

**Última atualização:** 25 de Novembro de 2025  
**Versão:** 1.0.0  
**Status:** Em Desenvolvimento
