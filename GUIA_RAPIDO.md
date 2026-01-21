# 🚀 Guia Rápido - Gourmet Saudável

## Início Rápido (5 minutos)

### 1. Instalar e Iniciar

```bash
cd gourmet_saudavel
pnpm install
pnpm dev
```

Acesse: `http://localhost:3000`

---

## 📍 Rotas Principais

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Home/Landing Page | Público |
| `/produtos` | Catálogo de Pratos | Público |
| `/pacotes` | Catálogo de Pacotes | Público |
| `/admin/pacotes` | Gerenciar Pacotes | Admin |

---

## 🎯 Tarefas Comuns

### Criar um Novo Pacote Mensal

1. Faça login como admin
2. Vá para `/admin/pacotes`
3. Clique em "Novo Pacote"
4. Preencha:
   - **Nome:** "Pacote 5 Pratos - Janeiro"
   - **Slug:** "pacote-5-janeiro"
   - **Preço Base:** "129.90"
   - **Opções:** "5"
   - **Mês:** "2025-01"
5. Clique "Salvar"
6. Adicione as opções (pratos + tamanhos)

### Adicionar Opção ao Pacote

1. No admin de pacotes, clique no pacote
2. Clique "Adicionar Opção"
3. Selecione:
   - **Prato:** (dropdown)
   - **Tamanho:** (dropdown)
4. Clique "Salvar"

### Cliente Selecionando Pacote

1. Vá para `/pacotes`
2. Clique no pacote desejado
3. Para cada opção:
   - Selecione um prato
   - Selecione um tamanho
4. Ajuste a quantidade
5. Clique "Adicionar ao Carrinho"

---

## 🛠️ Desenvolvimento

### Estrutura de Arquivos

```
client/src/
├── pages/          # Páginas (Home, Products, Packages)
├── components/     # Componentes reutilizáveis
└── lib/            # Utilitários (tRPC client)

server/
├── routers.ts      # APIs (tRPC procedures)
├── packages.ts     # Helpers de pacotes
└── db.ts           # Queries ao BD
```

### Adicionar Nova Página

1. Criar `client/src/pages/NovaPagina.tsx`
2. Adicionar rota em `client/src/App.tsx`
3. Importar componentes necessários

### Adicionar Nova API (tRPC Procedure)

1. Adicionar em `server/routers.ts`:

```typescript
novaProcedure: publicProcedure
  .input(z.object({ /* ... */ }))
  .query(async ({ input }) => {
    // Implementação
  }),
```

2. Usar no frontend:

```typescript
const { data } = trpc.novaProcedure.useQuery({ /* ... */ });
```

---

## 🗄️ Banco de Dados

### Criar Tabela Nova

1. Editar `drizzle/schema.ts`
2. Adicionar tabela com Drizzle ORM
3. Executar: `pnpm db:push`

### Query ao BD

1. Adicionar helper em `server/db.ts`
2. Usar em `server/routers.ts`

---

## 🧪 Testes

```bash
# Rodar testes
pnpm test

# Rodar teste específico
pnpm test packages

# Watch mode
pnpm test --watch
```

---

## 📦 Deploy

### Preparar para Deploy

1. Criar checkpoint: `pnpm webdev:checkpoint`
2. Clicar "Publish" no Management UI
3. Domínio automático: `xxx.manus.space`

---

## 🎨 Cores e Estilos

### Paleta Principal

```css
--primary: #2D5A3D;      /* Verde Esmeralda */
--secondary: #D4AF37;    /* Amarelo Dourado */
--background: #FFFFFF;   /* Branco */
--foreground: #2C2C2C;   /* Cinza Carvão */
```

### Usar em Componentes

```tsx
<button className="bg-primary text-white hover:bg-primary/90">
  Clique aqui
</button>
```

---

## ❓ FAQ

**P: Como adicionar um novo prato?**
R: Os pratos são importados do WooCommerce. Para adicionar, edite no painel do WooCommerce e execute a extração novamente.

**P: Como mudar as cores?**
R: Edite `client/src/index.css` e procure por `@theme { }` para alterar a paleta.

**P: Como adicionar acompanhamentos?**
R: Vá para Admin → Pacotes → Editar Pacote → Adicionar Acompanhamento.

**P: Posso usar o site sem login?**
R: Sim! Clientes podem navegar e adicionar ao carrinho sem login. Login é necessário para checkout.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `DOCUMENTACAO.md` para detalhes completos
2. Verifique `GRAPHICS_SYSTEM.md` para grafismos
3. Confira `todo.md` para tarefas pendentes

---

**Última atualização:** 25 de Novembro de 2025
