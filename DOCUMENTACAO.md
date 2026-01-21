# 📚 Documentação Completa - Gourmet Saudável

## 🎯 Visão Geral do Projeto

**Gourmet Saudável** é um e-commerce moderno de refeições congeladas fit, desenvolvido com:
- **Frontend:** React 19 + Tailwind CSS 4
- **Backend:** Node.js + Express + tRPC
- **Banco de Dados:** MySQL/TiDB
- **Autenticação:** Manus OAuth
- **Identidade Visual:** Verde Esmeralda + Amarelo Dourado

O projeto foi migrado de um WooCommerce existente para uma arquitetura independente, oferecendo total flexibilidade para gerenciar pacotes mensais, acompanhamentos customizáveis e sistema de fidelidade.

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### **1. users** (Autenticação)
```sql
- id (PK)
- openId (Manus OAuth)
- name, email, loginMethod
- role (admin | user)
- createdAt, updated_at, lastSignedIn
```

#### **2. dishes** (Pratos Individuais)
```sql
- id (PK)
- name, description
- image_url
- category_id (FK)
- is_active
- createdAt, updated_at
```

#### **3. dishSizes** (Tamanhos de Pratos)
```sql
- id (PK)
- dish_id (FK)
- name (ex: Pequeno, Médio, Grande)
- weight (ex: 200g, 300g)
- price_adjustment (variação de preço)
```

#### **4. accompanimentGroups** (Grupos de Acompanhamentos)
```sql
- id (PK)
- name (ex: Acompanhamento 100g, Acompanhamento 80g)
- weight
- is_required (obrigatório ou opcional)
```

#### **5. accompanimentOptions** (Opções dentro de Grupos)
```sql
- id (PK)
- group_id (FK)
- label (ex: Arroz Branco, Batata Doce)
- price_extra (custo adicional)
```

#### **6. size_accompaniments** (Relacionamento Tamanho ↔ Acompanhamentos)
```sql
- id (PK)
- size_id (FK)
- group_id (FK)
- Determina quais acompanhamentos estão disponíveis para cada tamanho
```

#### **7. packages** (Pacotes Mensais)
```sql
- id (PK)
- name (ex: Pacote 5 Pratos)
- slug (URL-friendly)
- description
- image_url
- base_price
- number_of_options (quantas opções o pacote tem)
- month (ex: 2025-01)
- is_active
- display_order
```

#### **8. package_options** (Opções dentro de Pacotes)
```sql
- id (PK)
- package_id (FK)
- dish_id (FK)
- size_id (FK)
- option_number (1, 2, 3...)
- weight
- price_adjustment (preço extra da opção)
```

#### **9. package_option_accompaniments** (Acompanhamentos por Opção)
```sql
- id (PK)
- package_option_id (FK)
- accompaniment_group_id (FK)
- selected_option_id (FK)
- Armazena a seleção de acompanhamento feita pelo cliente
```

#### **10. orders** (Pedidos)
```sql
- id (PK)
- user_id (FK)
- status (pending, processing, shipped, delivered)
- total_price
- points_used (pontos de fidelidade usados)
- createdAt, updated_at
```

#### **11. orderItems** (Itens do Pedido)
```sql
- id (PK)
- order_id (FK)
- product_type (dish | package)
- product_id
- quantity
- unit_price
- subtotal
```

#### **12. order_item_accompaniments** (Acompanhamentos Selecionados)
```sql
- id (PK)
- order_item_id (FK)
- accompaniment_group_id (FK)
- selected_option_id (FK)
- price_adjustment
```

#### **13. user_loyalty_points** (Saldo de Pontos)
```sql
- id (PK)
- user_id (FK)
- balance (saldo atual)
- updated_at
```

#### **14. loyalty_point_history** (Histórico de Transações)
```sql
- id (PK)
- user_id (FK)
- type (earned | spent)
- amount
- order_id (FK, opcional)
- description
- createdAt
```

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

```
gourmet_saudavel/
├── client/                          # Frontend React
│   ├── public/                      # Assets estáticos
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Products.tsx         # Catálogo de pratos
│   │   │   ├── Packages.tsx         # Catálogo de pacotes
│   │   │   ├── AdminPackages.tsx    # Admin: Gerenciar pacotes
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navegação principal
│   │   │   ├── Footer.tsx           # Rodapé
│   │   │   ├── ProductCard.tsx      # Card de prato
│   │   │   ├── ProductImageOverlay.tsx  # Grafismos de imagem
│   │   │   ├── ProductBadge.tsx     # Badges (Novo, Promo, etc)
│   │   │   ├── GeometricPatterns.tsx    # Padrões SVG
│   │   │   ├── PackageSelector.tsx  # Seletor de opções
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx     # Tema (light/dark)
│   │   ├── lib/
│   │   │   └── trpc.ts              # Cliente tRPC
│   │   ├── App.tsx                  # Router principal
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Estilos globais + paleta de cores
│   └── index.html
│
├── server/                          # Backend Node.js
│   ├── _core/                       # Framework core (não editar)
│   │   ├── context.ts
│   │   ├── trpc.ts
│   │   ├── env.ts
│   │   └── ...
│   ├── routers.ts                   # tRPC routers (procedures)
│   ├── db.ts                        # Query helpers
│   ├── packages.ts                  # Helpers para pacotes
│   ├── packages.test.ts             # Testes de pacotes
│   └── auth.logout.test.ts          # Teste de logout
│
├── drizzle/                         # Migrations + Schema
│   ├── schema.ts                    # Definição de tabelas
│   └── migrations/                  # Histórico de migrations
│
├── shared/                          # Código compartilhado
│   ├── const.ts
│   └── types.ts
│
├── storage/                         # S3 helpers
│   └── index.ts
│
├── DOCUMENTACAO.md                  # Este arquivo
├── GRAPHICS_SYSTEM.md               # Documentação de grafismos
├── todo.md                          # Checklist de tarefas
├── pnpm-lock.yaml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## 🎨 Identidade Visual

### Paleta de Cores

| Elemento | Cor | Hex | OKLCH | Uso |
|----------|-----|-----|-------|-----|
| **Primária** | Verde Esmeralda | #2D5A3D | oklch(42% 0.08 155) | Header, Logo, Títulos |
| **Secundária** | Amarelo Dourado | #D4AF37 | oklch(75% 0.18 82) | Botões, CTAs, Destaques |
| **Fundo** | Branco | #FFFFFF | oklch(100% 0 0) | Fundo geral |
| **Texto** | Cinza Carvão | #2C2C2C | oklch(15% 0 0) | Textos principais |
| **Destaque** | Verde Claro | #4A7C59 | oklch(55% 0.08 155) | Hover, Links |

### Tipografia

- **Headings:** Serif (Georgia, serif) - Elegância e sofisticação
- **Body:** Sans-serif (Segoe UI, Arial) - Legibilidade
- **Font Weights:** 400 (regular), 600 (semibold), 700 (bold)

### Componentes de UI

- **Buttons:** Amarelo Dourado com hover em Verde Claro
- **Cards:** Branco com sombra suave e borda Verde Esmeralda
- **Badges:** Gradiente Verde Esmeralda → Amarelo Dourado
- **Inputs:** Borda Verde Esmeralda, focus em Amarelo Dourado

---

## 🚀 Funcionalidades Implementadas

### ✅ Fase 1: Identidade Visual
- [x] Nova paleta de cores (Verde Esmeralda + Amarelo Dourado)
- [x] Logo redesenhado
- [x] Componentes de UI com nova identidade
- [x] Responsividade mobile-first

### ✅ Fase 2: Grafismos e Overlays
- [x] ProductImageOverlay com padrões SVG
- [x] Badges dinâmicos (Promoção, Novo, Bestseller, Vegano, etc)
- [x] Ícones informativos
- [x] Efeitos de hover (zoom, sombra 3D, shine effect)
- [x] Padrões geométricos reutilizáveis

### ✅ Fase 3: Migração de Dados
- [x] Extração de 123 produtos do WooCommerce via API
- [x] Extração de 435 clientes
- [x] Extração de 1.645 pedidos
- [x] Extração de 20 categorias
- [x] Schema BD otimizado com 14 tabelas
- [x] Migrations aplicadas com sucesso

### ✅ Fase 4: Admin Panel
- [x] Página `/admin/pacotes` para gerenciar pacotes
- [x] Criar novo pacote
- [x] Editar pacote existente
- [x] Deletar pacote
- [x] Seletor de opções (pratos + tamanhos)
- [x] Configurador de acompanhamentos
- [x] Gerenciador de preços

### ✅ Fase 5: Frontend de Pacotes
- [x] Página pública `/pacotes`
- [x] Componente PackageSelector
- [x] Seletor de opções dinâmico
- [x] Cálculo automático de preço
- [x] Integração com tRPC

### ⏳ Fase 6: Sistema de Fidelidade (Em Desenvolvimento)
- [ ] Exibir saldo de pontos do usuário
- [ ] Permitir usar pontos no checkout
- [ ] Atualizar saldo após compra
- [ ] Histórico de transações de pontos

### ⏳ Fase 7: Carrinho e Checkout (Em Desenvolvimento)
- [ ] Adicionar produtos ao carrinho
- [ ] Visualizar carrinho
- [ ] Aplicar cupons/descontos
- [ ] Integrar pagamento (Stripe/PagSeguro)
- [ ] Confirmar pedido

---

## 📱 Páginas Principais

### **Home (`/`)**
- Hero section com proposta de valor
- Seção de categorias (Marmitas Fit, Executivas, Pacotes, Sopas)
- Depoimentos de clientes
- CTA para explorar produtos

### **Produtos (`/produtos`)**
- Grid de pratos individuais
- Filtros por categoria
- Busca por nome
- ProductCard com grafismos
- Adicionar ao carrinho (em desenvolvimento)

### **Pacotes (`/pacotes`)**
- Grid de pacotes disponíveis
- PackageSelector modal/popup
- Seleção de opções (pratos)
- Seleção de acompanhamentos
- Cálculo dinâmico de preço
- Adicionar ao carrinho

### **Admin Pacotes (`/admin/pacotes`)**
- Listar todos os pacotes
- Criar novo pacote
- Editar pacote
- Deletar pacote
- Gerenciar opções por pacote
- Configurar acompanhamentos

---

## 🔧 Como Usar

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd gourmet_saudavel

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
# Copiar .env.example para .env e preencher com suas credenciais

# Executar migrations
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Criar Pacote Mensal (Admin)

1. Acessar `/admin/pacotes`
2. Clicar em "Novo Pacote"
3. Preencher:
   - Nome (ex: "Pacote 5 Pratos")
   - Slug (ex: "pacote-5-pratos")
   - Descrição
   - Preço base
   - Número de opções (3, 5, 10, etc)
   - Mês (ex: 2025-01)
4. Salvar
5. Adicionar opções:
   - Selecionar prato
   - Selecionar tamanho
   - Configurar acompanhamentos
6. Publicar

### Cliente Selecionando Pacote

1. Acessar `/pacotes`
2. Clicar em pacote desejado
3. Para cada opção:
   - Selecionar prato no dropdown
   - Selecionar tamanho
   - Selecionar acompanhamentos (se houver)
4. Ajustar quantidade
5. Clicar "Adicionar ao Carrinho"
6. Prosseguir para checkout

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
pnpm test

# Testes específicos
pnpm test packages
pnpm test auth

# Com watch mode
pnpm test --watch
```

### Testes Implementados

- ✅ `packages.test.ts` - Testes de CRUD de pacotes (2/5 passando)
- ✅ `auth.logout.test.ts` - Teste de logout

### Próximos Testes

- [ ] Testes de seleção de acompanhamentos
- [ ] Testes de cálculo de preço
- [ ] Testes de carrinho
- [ ] Testes de fidelidade

---

## 🔌 Integrações

### WooCommerce API

**Credenciais (já configuradas):**
- URL: `https://gourmetsaudavel.com.br`
- Consumer Key: `ck_9886ee50d6a6eea496ccf24f24c21d2a496f603c`
- Consumer Secret: `cs_95368563fa7635e00fd9fc689c9a7988f573697e`

**Dados Extraídos:**
- 123 produtos (pratos)
- 435 clientes
- 1.645 pedidos
- 20 categorias

### Manus OAuth

Autenticação integrada via Manus OAuth. Usuários podem fazer login e gerenciar:
- Perfil
- Histórico de pedidos
- Saldo de pontos de fidelidade

### S3 Storage (Futuro)

Preparado para integração com S3 para:
- Upload de imagens de produtos
- Armazenamento de documentos
- Backup de dados

---

## 📝 Próximos Passos

### 🔴 Prioridade Alta

1. **Implementar Seletor de Acompanhamentos**
   - Adicionar dropdowns para acompanhamentos ao PackageSelector
   - Cálculo de preço extra por acompanhamento
   - Validação de acompanhamentos obrigatórios

2. **Carrinho Funcional**
   - Mutation para adicionar produtos ao carrinho
   - Persistência em localStorage/BD
   - Visualizar carrinho
   - Atualizar/remover itens

3. **Sistema de Fidelidade**
   - Exibir saldo de pontos do usuário
   - Permitir resgate de pontos no checkout
   - Atualizar saldo após compra
   - Histórico de transações

### 🟡 Prioridade Média

4. **Checkout e Pagamento**
   - Integrar Stripe ou PagSeguro
   - Fluxo de checkout completo
   - Confirmação de pedido
   - Email de confirmação

5. **Página de Detalhes do Produto**
   - Galeria de imagens
   - Informações nutricionais
   - Avaliações de clientes
   - Produtos relacionados

6. **Melhorias de UX**
   - Filtros avançados de produtos
   - Busca com autocomplete
   - Favoritos/Wishlist
   - Notificações de restock

### 🟢 Prioridade Baixa

7. **Admin Dashboard**
   - Relatórios de vendas
   - Gerenciamento de clientes
   - Histórico de pedidos
   - Análise de produtos populares

8. **Marketing**
   - Newsletter
   - Cupons e promoções
   - Programa de referência
   - SEO otimizado

---

## 🐛 Troubleshooting

### Erro: "Database not available"
- Verificar se a variável `DATABASE_URL` está configurada
- Executar `pnpm db:push` para criar tabelas

### Erro: "Only admins can..."
- Verificar se o usuário tem role `admin` no banco de dados
- Acessar `/admin` requer autenticação

### Erro: "Duplicate entry for slug"
- Slugs de pacotes devem ser únicos
- Adicionar timestamp ou ID ao slug

### Dev Server não inicia
- Limpar cache: `rm -rf node_modules/.vite`
- Reinstalar: `pnpm install`
- Reiniciar: `pnpm dev`

---

## 📚 Recursos Úteis

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## 👥 Contribuindo

Para adicionar novas funcionalidades:

1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Implementar feature
3. Adicionar testes
4. Fazer commit: `git commit -m "Add: nova funcionalidade"`
5. Push: `git push origin feature/nova-funcionalidade`
6. Criar Pull Request

---

## 📄 Licença

Propriedade de Gourmet Saudável. Todos os direitos reservados.

---

**Última atualização:** 25 de Novembro de 2025
**Versão:** 1.0.0
**Status:** Em Desenvolvimento
