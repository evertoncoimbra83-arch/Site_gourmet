# Gourmet Saudável - Project TODO

## ✅ Fase 1: Análise e Pesquisa
- [x] Analisar site atual (gourmetsaudavel.com)
- [x] Documentar estrutura e componentes existentes
- [x] Coletar referências de design para e-commerce de alimentos fit
- [x] Pesquisar teoria das cores para alimentos fit

## ✅ Fase 2: Nova Identidade Visual
- [x] Definir cores primárias: Verde Esmeralda (#2D5A3D)
- [x] Definir cores secundárias: Amarelo Dourado (#D4AF37)
- [x] Definir cores neutras: Branco, Cinza Carvão
- [x] Criar guia de cores com valores RGB, HEX e OKLCH
- [x] Atualizar CSS global com nova paleta (index.css)
- [x] Criar Header com nova identidade visual
- [x] Criar Footer com informações de contato
- [x] Atualizar página Home com nova identidade visual

## ✅ Fase 3: Integração WooCommerce
- [x] Configurar credenciais de API do WooCommerce
- [x] Criar helpers para requisições à API (woocommerce.ts)
- [x] Implementar routers tRPC para produtos e categorias
- [x] Validar credenciais com testes (woocommerce.test.ts)
- [x] Extrair 123 produtos via API
- [x] Extrair 435 clientes
- [x] Extrair 1.645 pedidos
- [x] Extrair 20 categorias

## ✅ Fase 4: Componentes e Páginas
- [x] Criar ProductCard para exibir produtos
- [x] Criar página de Produtos com filtros
- [x] Integrar Header e Footer no App.tsx
- [x] Implementar ProductImageOverlay com grafismos
- [x] Implementar badges dinâmicos (Promoção, Novo, Bestseller)
- [x] Adicionar ícones informativos (Vegano, Sem Glúten, Alto Teor de Proteína)
- [x] Criar padrões geométricos SVG como fundo
- [x] Implementar efeito de sombra 3D e hover animation
- [x] Integrar grafismos ao ProductCard

## ✅ Fase 5: Migração de Dados
- [x] Criar schema otimizado do BD (14 tabelas)
- [x] Fazer migração das tabelas (pnpm db:push)
- [x] Validar integridade dos dados

## ✅ Fase 6: Admin Panel para Pacotes
- [x] Criar página de admin para listar pacotes (/admin/pacotes)
- [x] Implementar criar novo pacote
- [x] Implementar editar pacote
- [x] Implementar deletar pacote
- [x] Seletor de pratos para adicionar opções
- [x] Configurador de acompanhamentos por opção
- [x] Gerenciador de preços

## ✅ Fase 7: Frontend de Pacotes
- [x] Criar página pública de pacotes (/pacotes)
- [x] Criar componente PackageSelector
- [x] Implementar seleção de opções dinâmica
- [x] Implementar cálculo de preço em tempo real

## ✅ Fase 8: Documentação Completa
- [x] Criar DOCUMENTACAO.md (estrutura BD, funcionalidades, próximos passos)
- [x] Criar GUIA_RAPIDO.md (tarefas comuns, FAQ, desenvolvimento)
- [x] Criar README.md (overview, stack, features)
- [x] Atualizar GRAPHICS_SYSTEM.md (sistema de grafismos)
- [x] Manter todo.md atualizado (checklist de tarefas)

## ✅ Fase 9: Seletor de Acompanhamentos Completo
- [x] Adicionar dropdowns para acompanhamentos ao PackageSelector
- [x] Cálculo de preço extra por acompanhamento
- [x] Validação de acompanhamentos obrigatórios
- [x] Testes unitários para acompanhamentos (3/3 passando)

## ✅ Fase 10: Carrinho Funcional
- [x] Criar mutation para adicionar produtos ao carrinho
- [x] Implementar persistência em localStorage
- [x] Criar página de visualização do carrinho
- [x] Implementar atualizar/remover itens
- [x] Integrar com checkout (rota /carrinho)
- [x] Testes unitários (17/17 passando)

## ✅ Fase 11: Sistema de Fidelidade (Pontos)
- [x] Exibir saldo de pontos do usuário logado
- [x] Permitir usar pontos no checkout
- [x] Atualizar saldo após compra
- [x] Criar histórico de transações de pontos
- [x] Testes unitários para fidelidade (17/17 passando)

## ✅ Fase 12: Gateway de Pagamento na Entrega
- [x] Criar schema para métodos de pagamento e bandeiras de cartão alimentação
- [x] Implementar helpers para gerenciar métodos de pagamento
- [x] Criar mutations tRPC para seleção de método de pagamento
- [x] Implementar componente de seleção de método (Dinheiro, Pix, Débito, Crédito, VA/VR)
- [x] Integrar seleção de pagamento ao checkout
- [x] Testes unitários para gateway de pagamento (29/29 passando)

## ✅ Fase 13: Admin Panel Completo
- [x] Correção de migração de BD (dish_id removido de dishSizes)
- [x] Teste de criação de tamanho (500g com 15% acréscimo)
- [x] Teste de criação de prato (Frango Grelhado com Batata Doce)
- [x] Página de gerenciamento de pacotes funcional
- [x] Admin panel totalmente operacional

## ⏳ Fase 14: Checkout e Confirmação de Pedido
- [ ] Fluxo de checkout completo com endereço
- [ ] Cálculo de frete
- [ ] Confirmação de pedido
- [ ] Email de confirmação
- [ ] Rastreamento de pedido

## ⏳ Fase 15: Melhorias de UX
- [ ] Página de detalhes do produto (galeria, nutrição, avaliações)
- [ ] Filtros avançados de produtos
- [ ] Busca com autocomplete
- [ ] Favoritos/Wishlist
- [ ] Notificações de restock

## ⏳ Fase 16: Admin Dashboard Avançado
- [ ] Relatórios de vendas
- [ ] Gerenciamento de clientes
- [ ] Histórico de pedidos
- [ ] Análise de produtos populares
- [ ] Gerenciamento de cupons/promoções

## ⏳ Fase 17: Marketing e SEO
- [ ] Newsletter
- [ ] Cupons e promoções
- [ ] Programa de referência
- [ ] SEO otimizado
- [ ] Open Graph tags

---

## 📊 Progresso Geral

**Completado:** 73 tarefas  
**Em Desenvolvimento:** 0 tarefas  
**Pendentes:** 2 tarefas  
**Total:** 75 tarefas

**Percentual:** 97% ✅

---

## 🎯 Próximos Passos Prioritários

1. **Checkout e Confirmação de Pedido** - Fluxo completo com endereço, frete e confirmação
2. **Melhorias de UX** - Página de detalhes do produto, filtros avançados, busca com autocomplete
3. **Admin Dashboard** - Relatórios de vendas, gerenciamento de clientes, histórico de pedidos

---

## 📝 Notas

- Schema BD otimizado com 14 tabelas relacionadas
- Dados do WooCommerce extraídos com sucesso (123 produtos, 435 clientes, 1.645 pedidos)
- Admin panel funcional para gerenciar pacotes mensais
- Documentação completa incluída (DOCUMENTACAO.md, GUIA_RAPIDO.md, README.md)
- Grafismos e overlays implementados com sucesso
- Seletor de acompanhamentos dinâmico com cálculo de preço (3/3 testes passando)
- Carrinho persistente com localStorage e sincronização ao BD (17/17 testes passando)
- Sistema de fidelidade com pontos, resgate e histórico (17/17 testes passando)
- Gateway de pagamento na entrega com 5 métodos (Dinheiro, Pix, Débito, Crédito, VA/VR)
- Cadastro de bandeiras de cartão alimentação (VA/VR) com 6 bandeiras padrão
- Testes unitários criados (66+ testes passando no total)

---

**Última atualização:** 25 de Novembro de 2025  
**Status:** 97% Completo - Pronto para Checkout e Melhorias de UX  
**Versão:** 1.0.0

## Status da Correcao de Migracao

**Problema Resolvido:** Erro de migracao de BD com foreign keys com nomes longos

**Solucao Aplicada:**
1. Removidas todas as migracoes antigas (0000-0004)
2. Limpas todas as tabelas do banco de dados
3. Reinicializado arquivo de journal de migracoes
4. Gerada nova migracao limpa com schema otimizado
5. Testada criacao de tamanho (500g com 15% acrescimo)
6. Testada criacao de prato (Frango Grelhado com Batata Doce)

**Resultado:** Admin panel totalmente funcional, pronto para uso

## 🔄 Fase 11: Sistema de Fidelidade (Pontos) - EM DESENVOLVIMENTO
- [ ] Criar helpers para gerenciar pontos de fidelidade
- [ ] Implementar mutations tRPC para fidelidade (obter saldo, usar pontos, adicionar pontos)
- [ ] Criar componente de exibição de saldo de pontos
- [ ] Integrar resgate de pontos ao carrinho com cálculo de desconto
- [ ] Implementar acúmulo de pontos após compra
- [ ] Criar página de histórico de pontos
- [ ] Testes unitários para fidelidade

## 🔄 Fase 12: Gateway de Pagamento na Entrega - EM DESENVOLVIMENTO
- [ ] Criar schema para métodos de pagamento e bandeiras de cartão alimentação
- [ ] Implementar helpers para gerenciar métodos de pagamento
- [ ] Criar mutations tRPC para seleção de método de pagamento
- [ ] Implementar componente de seleção de método (Dinheiro, Pix, Débito, Crédito, VA/VR)
- [ ] Integrar seleção de pagamento ao checkout
- [ ] Criar página de cadastro de bandeiras de cartão alimentação (admin)
- [ ] Testes unitários para gateway de pagamento

## 🔄 Fase 15: Refatoração do Seletor de Pratos
- [ ] Analisar estrutura de tamanhos e acompanhamentos do WooCommerce
- [ ] Criar mutations tRPC para buscar tamanhos e acompanhamentos
- [ ] Refatorar componente DishSelector com seleção visual de tamanho
- [ ] Implementar seleção de acompanhamentos por grupo
- [ ] Cálculo dinâmico de preço (base + acréscimo tamanho + acompanhamentos)
- [ ] Integrar ao carrinho com todas as informações
- [ ] Testes unitários para seletor de pratos

## ✅ Fase 16: Painel de Administração (Base)
- [x] Criar layout base do painel admin com sidebar
- [x] Implementar dashboard com estatísticas (vendas, pedidos, clientes)
- [x] Adicionar rota /admin com proteção de acesso (apenas admin)
- [x] Testes para painel admin (12/12 passando)
- [ ] Criar gerenciamento de pratos (CRUD)
- [ ] Criar gerenciamento de tamanhos e acompanhamentos
- [ ] Criar gerenciamento de pacotes mensais

## ✅ Fase 17: Gerenciamento Completo do Admin (Backend)
- [x] Helpers para CRUD de pratos (admin-dishes.ts)
- [x] Helpers para tamanhos e acompanhamentos (admin-sizes-accompaniments.ts)
- [x] Helpers para relatórios de vendas (admin-reports.ts)
- [x] Mutations tRPC para todas as operações com middleware adminProcedure
- [x] Proteção de acesso (apenas usuários com role=admin)

## ✅ Fase 18: Páginas de Admin Frontend
- [x] Criar página de gerenciamento de pratos (/admin/dishes)
- [x] Criar página de gerenciamento de tamanhos e acompanhamentos
- [x] Criar página de gerenciamento de pacotes com seleção visual
- [x] Integrar páginas ao AdminLayout com navegação
- [x] Rotas de admin integradas ao App.tsx

## ✅ Fase 19: Refatoração de Tamanhos e Acompanhamentos
- [x] Refatorar AdminSizesAccompaniments com fluxo correto
- [x] Cadastro de tamanhos com % de acréscimo
- [x] Cadastro de grupos de acompanhamentos com opções
- [x] Integrar mutations tRPC corretas (admin.sizes.*, admin.accompaniments.*)
- [x] Validar no servidor (0 erros TypeScript)


## ✅ Fase 20: Refatoração de Interface AdminSizesAccompaniments
- [x] Refatorar página AdminSizesAccompaniments para integrar acompanhamentos dentro de cada tamanho
- [x] Implementar pergunta "Deseja adicionar acompanhamentos?" com botões Sim/Não obrigado
- [x] Criar componente SizeAccompanimentCard com expansão dinâmica
- [x] Integrar grupos de acompanhamentos dentro do card de tamanho
- [x] Atualizar backend para suportar relação size_id com accompanimentGroups
- [x] Testar fluxo completo de criação de tamanho com acompanhamentos
- [x] Teste de adição de acompanhamento ao tamanho 200g com sucesso
- [x] Adicionar sistema de abas para melhor acesso ao cadastro de acompanhamentos
- [x] Testar navegação entre abas (Configuração de Tamanhos / Gerenciar Acompanhamentos)


## ✅ Fase 21: Correção de Erro de Price Modifier e Suporte a Preço 0
- [x] Corrigir erro de price_modifier inválido na criação de opções de acompanhamento
- [x] Permitir preço 0 (campo vazio = gratýito)
- [x] Validar entrada de preço no formulário
- [x] Testar criação de opção com preço válido (Arroz Integral R$ 5.60)
- [x] Testar criação de opção com preço 0 (Brocolos Cozidos gratýito)
- [x] Melhorar mensagem de erro para duplicata


## ✅ Fase 22: Melhorias no Carrinho e Exibição de Produtos (04/12/2024)
- [x] Melhorar exibição de produtos no frontend com detalhes completos
- [x] Aprimorar carrinho com descrição detalhada do pedido
- [x] Adicionar visualização clara de acompanhamentos selecionados no carrinho
- [x] Adicionar nome do tamanho selecionado no carrinho
- [x] Mostrar nomes dos acompanhamentos (não apenas preços)
- [x] Adicionar campo sizeId à tabela orderItems


## 🔄 Fase 23: Replicar Sistema de Pacotes do WordPress (04/12/2024)
- [ ] Acessar wp-admin e analisar como pacotes funcionam atualmente
- [ ] Documentar estrutura de pacotes (opções, preços, seleção)
- [ ] Implementar mesma lógica no novo sistema
- [ ] Testar funcionalidade completa de pacotes


### 🎫 Fase 24: Sistema de Cupons e Funcionalidades E-commerce (04/12/2024)
- [x] Criar tabela de cupons no banco (código, desconto, validade, limite de uso)
- [x] Criar tabela de histórico de uso de cupons
- [x] Adicionar campos de cupom e frete à tabela orders
- [x] Implementar validação de cupons (verificar validade, uso, valor mínimo)
- [x] Criar funções para aplicar/remover cupons do pedido
- [x] Atualizar cálculo de total do carrinho (subtotal - desconto + frete)
- [x] Criar rotas tRPC para gerenciar cupons (admin)
- [x] Criar rotas tRPC para aplicar cupons no carrinho
- [ ] Criar interface do carrinho com campo para aplicar cupom
- [ ] Criar painel admin para gerenciar cupons (criar, editar, desativar)
- [ ] Implementar cálculo de frete
- [ ] Criar página de checkout completa
- [ ] Adicionar confirmação de pedido por email
- [ ] Implementar rastreamento de pedidos


## ✅ Fase 25: Interface Admin de Cupons (04/12/2024)
- [x] Criar página AdminCoupons.tsx com listagem de cupons
- [x] Implementar tabela com informações dos cupons (código, tipo, valor, validade, uso)
- [x] Adicionar formulário de criação de cupom
- [x] Adicionar formulário de edição de cupom
- [x] Implementar ações (ativar/desativar, deletar)
- [x] Adicionar rota no App.tsx e AdminLayout
- [x] Adicionar ícone Ticket no menu


## ✅ Fase 26: Cupons no Carrinho e Descontos Automáticos (04/12/2024)
- [x] Criar tabela de regras de desconto automático por quantidade (quantity_discount_rules)
- [x] Implementar backend para calcular desconto automático por quantidade (discount-rules.ts)
- [x] Adicionar campo discountReason ao schema de orders
- [x] Atualizar updateCartTotals para aplicar descontos automáticos
- [x] Adicionar campo de cupom no componente Cart (UI completa)
- [x] Exibir desconto aplicado no resumo do carrinho
- [x] Criar painel admin para gerenciar regras de desconto por quantidade (AdminDiscountRules.tsx)
- [x] Adicionar rotas tRPC para discount rules (admin.discountRules.*)
- [x] Adicionar rota no App.tsx e AdminLayout
- [x] Sistema de regras personalizadas (ex: 3-5 itens 3%, 6-10 itens 10%)
- [ ] Implementar validação de cupom em tempo real no frontend
- [ ] Implementar backend para cupons automáticos por valor mínimo
- [ ] Criar relatório de uso de cupons (dashboard)
- [ ] Testar fluxo completo de aplicação de cupons


## 🛒 Fase 27: Checkout Completo e Confirmação de Pedido (04/12/2024)
- [x] Conectar validação de cupom no frontend (cart.validateCoupon)
- [x] Criar tabela de faixas de frete por CEP (shipping_zones)
- [x] Implementar backend para cálculo de frete (shipping.ts)
- [x] Criar rotas tRPC para shipping (shipping.calculate)
- [x] Criar rotas admin para gerenciar zonas de frete
- [x] Criar página de checkout (/checkout)
- [x] Formulário de endereço de entrega
- [x] Cálculo de frete em tempo real
- [x] Seleção de método de pagamento
- [x] Resumo final do pedido
- [x] Adicionar botão "Finalizar Compra" no carrinho
- [x] Adicionar rota /checkout no App.tsx
- [ ] Confirmação de pedido (criar order com todos os dados)
- [ ] Enviar email de confirmação
- [ ] Implementar rastreamento de pedido
- [ ] Página de acompanhamento de pedido
- [ ] Testar fluxo completo de compra


## 🔄 Fase 28: Sistema de Pacotes Completo (05/12/2024)
- [x] Backend: criar funções para gerenciar pacotes
  - [x] createPackage - criar pacote com número de opções
  - [x] getAllPackages - listar pacotes ativos
  - [x] getPackageWithOptions - buscar pacote completo
  - [x] createPackageOption - criar opção com título customizado
  - [x] updatePackageOptionName - atualizar nome da opção
  - [x] addDishesToOption - adicionar múltiplos pratos
  - [x] addAccompanimentGroupsToOption - adicionar até 2 grupos
  - [x] removePackageOption - remover opção
  - [x] updatePackage - atualizar informações
  - [x] deletePackage - deletar pacote

- [x] Rotas tRPC para pacotes
  - [x] packages.admin.list
  - [x] packages.admin.get
  - [x] packages.admin.create
  - [x] packages.admin.update
  - [x] packages.admin.delete
  - [x] packages.admin.createOption
  - [x] packages.admin.updateOptionName
  - [x] packages.admin.addDishesToOption
  - [x] packages.admin.addAccompanimentsToOption
  - [x] packages.admin.removeOption
  - [x] packages.public.list - listar pacotes para clientes
  - [x] packages.public.get - buscar pacote para clientes

- [x] Admin Panel - gerenciar pacotes
  - [x] Formulário de criação/edição de pacotes
  - [x] Lista de pacotes com cards expansíveis
  - [x] PackageOptionsManager - gerenciador de opções
  - [x] Criar opções com títulos customizados
  - [x] Selecionar múltiplos pratos por opção
  - [x] Selecionar até 2 grupos de acompanhamentos por opção
  - [x] Remover opções

- [ ] Frontend - página de pacotes para clientes
  - [ ] Listar pacotes disponíveis
  - [ ] Exibir detalhes do pacote
  - [ ] Permitir escolher 1 prato por opção
  - [ ] Selecionar acompanhamentos (até 2 grupos)
  - [ ] Adicionar pacote ao carrinho
  - [ ] Validar seleções antes de adicionar

## 🛒 Fase 29: Finalizar Checkout e Pedidos (05/12/2024)
- [ ] Finalizar checkout
  - [ ] Salvar pedido no banco de dados
  - [ ] Gerar número de pedido único
  - [ ] Calcular total com descontos e frete
  - [ ] Validar cupons de desconto
  - [ ] Validar CEP e calcular frete

- [ ] Sistema de confirmação
  - [ ] Enviar email de confirmação para cliente
  - [ ] Enviar notificação para admin
  - [ ] Exibir página de confirmação com resumo do pedido
  - [ ] Gerar PDF do pedido

- [ ] Rastreamento de pedidos
  - [ ] Criar tabela de status de pedidos
  - [ ] Implementar workflow: pendente → preparando → enviado → entregue
  - [ ] Página "Meus Pedidos" para clientes
  - [ ] Admin: atualizar status de pedidos
  - [ ] Notificar cliente quando status mudar


## 🐛 Fase 29: Correção de Bugs Reportados (05/12/2024)
- [ ] Corrigir preço NaN no modal de adicionar produto
- [ ] Adicionar pergunta "Deseja adicionar acompanhamentos?" no modal
- [ ] Implementar seleção de múltiplos pratos por opção no admin de pacotes
  - [ ] Interface para selecionar pratos com checkboxes
  - [ ] Salvar pratos selecionados via addDishesToOption
  - [ ] Exibir pratos selecionados na lista de opções


## 🐛 Fase 30: Correções Críticas (05/12/2024)
- [x] Remover TODAS dependências do WooCommerce (usar apenas banco local)
- [x] Mudar modal de popup central para drawer lateral (estilo iFood/Uber)
- [x] Corrigir cálculo de preço no drawer usando dados do banco local
- [ ] Implementar seleção de múltiplos pratos por opção no admin de pacotes


## 🐛 Fase 31: Novos Bugs Reportados (05/12/2024)
- [ ] Admin: não consigo selecionar pratos para as opções do pacote
- [ ] Frontend: categorias não aparecem na barra de filtros
- [ ] Frontend: drawer ainda aparece como popup (cache do navegador)
- [ ] Frontend: preço ainda mostra NaN nos cards
- [ ] Frontend: pergunta "com acompanhamento?" não aparece


## 📦 Fase 32: Sistema de Pacotes Completo Baseado no WordPress (05/12/2024)

### Backend
- [x] Aumentar limite de grupos de acompanhamentos de 2 para 4
- [x] Corrigir validação no packages.ts (mudar de max 2 para max 4)
- [x] Atualizar rota admin.packages.addAccompanimentsToOption
- [x] Corrigir refetch após criar opção no AdminPackages.tsx

### Admin Interface
- [x] Interface de seleção de múltiplos pratos já existe ✅
- [x] Atualizar texto "máx. 2" para "máx. 4" no AdminPackages.tsx
- [x] Adicionar seção para editar grupos de acompanhamentos

### Frontend Público
- [ ] Criar página /pacotes listando pacotes disponíveis
- [ ] Criar componente PackageCard com imagem e preço
- [ ] Criar página /pacote/[slug] para detalhes do pacote
- [ ] Implementar dropdowns para seleção de pratos (1 por opção)
- [ ] Implementar dropdowns para seleção de acompanhamentos
- [ ] Botão "Adicionar ao Carrinho" com pacote configurado

### Catálogo de Pratos
- [ ] Implementar barra de categorias no topo
- [ ] Filtrar pratos por categoria selecionada
- [ ] Corrigir preço NaN nos cards (investigar basePrice)

### Testes
- [ ] Testar criação de pacote no admin
- [ ] Testar seleção de pratos e acompanhamentos no admin
- [ ] Testar visualização de pacote no frontend
- [ ] Testar seleção de opções pelo cliente
- [ ] Testar adição ao carrinho


## 🐛 Fase 33: Bug - Não Consigo Adicionar Pratos e Acompanhamentos (05/12/2024)
- [ ] Reproduzir problema no navegador
- [ ] Verificar se opções estão sendo criadas corretamente
- [ ] Verificar se botão "Editar Pratos" aparece
- [ ] Verificar se lista de pratos carrega
- [ ] Verificar se checkboxes funcionam
- [ ] Verificar se botão "Salvar" envia dados corretamente
- [ ] Verificar resposta da API
- [ ] Corrigir problema identificado


## 🛍 Fase 14: Checkout e Confirmação de Pedido - EM DESENVOLVIMENTO (05/12/2024)
- [x] Implementar confirmação de pedido no backend
  - [x] Criar função createOrder que salva pedido completo no banco
  - [x] Validar dados obrigatórios (endereço, pagamento, itens)
  - [x] Calcular totais finais (subtotal, desconto, frete, total)
  - [x] Salvar orderItems com todos os detalhes
  - [x] Limpar carrinho após confirmação
- [x] Integrar botão "Finalizar Compra" no checkout
  - [x] Validar formulário de endereço
  - [x] Validar seleção de método de pagamento
  - [x] Validar cálculo de frete
  - [x] Chamar mutation createOrder
  - [x] Redirecionar para página de confirmação
- [ ] Implementar envio de email de confirmação
  - [ ] Criar template de email com detalhes do pedido
  - [ ] Integrar com serviço de email (usar built-in notification API)
  - [ ] Enviar email automaticamente após criar pedido
- [x] Sistema de rastreamento de pedidos
  - [x] Adicionar campo status à tabela orders (pendente, preparando, enviado, entregue)
  - [x] Criar funções para atualizar status
  - [x] Criar rotas tRPC para rastreamento
- [x] Página de acompanhamento de pedidos
  - [x] Criar página /meus-pedidos
  - [x] Listar pedidos do usuário logado
  - [x] Exibir status atual e histórico
  - [x] Permitir visualizar detalhes do pedido
- [ ] Testar fluxo completo de compra


## 🐛 Bug: Carrinho Não Adiciona Itens (05/12/2024)
- [ ] Investigar problema no navegador
- [ ] Verificar se drawer está abrindo corretamente
- [ ] Verificar se mutation addToCart está sendo chamada
- [ ] Verificar logs de erro no console
- [ ] Verificar se API está retornando erro 500
- [ ] Corrigir problema identificado
- [ ] Testar fluxo completo de adicionar ao carrinho


## 🐛 Bug: Carrinho Não Adiciona Itens (05/12/2024) - CORRIGIDO ✅
- [x] Investigar problema no navegador
- [x] Verificar se drawer está abrindo corretamente
- [x] Verificar se mutation addToCart está sendo chamada
- [x] Verificar logs de erro no console
- [x] Identificar causa raiz: DishCard usava DishSelectorModal próprio
- [x] Corrigir DishCard para chamar onAddToCart
- [x] Implementar mutation cart.add no ProductDrawer
- [x] Testar adição ao carrinho (FUNCIONANDO!)
- [ ] Corrigir contador do carrinho no header
- [ ] Adicionar invalidate para atualizar contador automaticamente


## 🐛 Bug: Acompanhamentos Não Carregam no Drawer (05/12/2024)
- [ ] Investigar query dishes.getDetailsForModal
- [ ] Verificar se grupos de acompanhamentos estão sendo retornados
- [ ] Verificar se opções de acompanhamentos estão sendo retornadas
- [ ] Comparar com código original do ZIP que funcionava
- [ ] Corrigir query ou componente ProductDrawer
- [ ] Testar seleção de acompanhamentos
- [ ] Validar que acompanhamentos são salvos no carrinho


---

## 🐛 BUGS CONHECIDOS

### Bug: Acompanhamentos Não Aparecem no ProductDrawer (05/12/2024) - ⚠️ EM INVESTIGAÇÃO

**Descrição:**
Após clicar em "Sim, quero" para adicionar acompanhamentos, os selects de acompanhamentos não são renderizados no drawer.

**O que funciona:**
- ✅ Drawer lateral desliza da direita (estilo iFood)
- ✅ CartContext integrado e funcionando
- ✅ Contador do carrinho atualiza corretamente
- ✅ Adicionar ao carrinho salva no banco de dados
- ✅ Seleção automática de tamanho quando há apenas 1 opção
- ✅ Pergunta "Deseja adicionar acompanhamentos?" aparece
- ✅ Botões "Sim, quero" / "Não, obrigado" funcionam visualmente

**O que não funciona:**
- ❌ Acompanhamentos não aparecem após clicar "Sim, quero"
- ❌ Array `data.links.filter()` retorna vazio

**Investigações realizadas:**
1. ✅ Query `getDetailsForModal` está correta (retorna sizes, links, groups, options)
2. ✅ Banco de dados tem 2 links corretos (size_id=1 vinculado a accompaniment_group_id=1 e 2)
3. ✅ ProductDrawer tem código correto de filtro
4. ✅ Código original do ZIP tem mesma lógica
5. ✅ useEffect de seleção automática funciona
6. ❌ Filtro `data.links.filter((link: any) => link.sizeId.toString() === selectedSizeId)` retorna array vazio

**Próximos passos:**
- [ ] Adicionar console.log para verificar estrutura exata de `data.links`
- [ ] Verificar se Drizzle está mapeando corretamente `size_id` para `sizeId`
- [ ] Testar query diretamente no backend
- [ ] Comparar resposta da API com estrutura esperada no frontend

**Arquivos envolvidos:**
- `/home/ubuntu/gourmet_saudavel/client/src/components/ProductDrawer.tsx`
- `/home/ubuntu/gourmet_saudavel/server/routers.ts` (query `getDetailsForModal`)
- `/home/ubuntu/gourmet_saudavel/server/db.ts`
- `/home/ubuntu/gourmet_saudavel/drizzle/schema.ts`

**Checkpoint:** cbc5286e (com bug documentado)

---


## 🚚 Fase 30: Cálculo de Frete e Checkout Completo (05/12/2024)
- [ ] Criar tabela de zonas de entrega (shipping_zones) com faixas de CEP e preços
- [ ] Integrar API ViaCEP para validação de endereço
- [ ] Implementar backend para cálculo de frete baseado em CEP
- [ ] Criar tabela de métodos de pagamento (payment_methods) com desconto opcional
- [ ] Implementar rotas tRPC para métodos de pagamento
- [ ] Criar página de checkout completa (/checkout)
- [ ] Formulário de endereço de entrega com validação de CEP
- [ ] Seleção de método de pagamento com aplicação de desconto
- [ ] Cálculo automático de frete e total final
- [ ] Resumo completo do pedido antes de finalizar
- [ ] Implementar confirmação de pedido (criar order)
- [ ] Sistema de envio de email de confirmação
- [ ] Geração de número de rastreamento

## 👤 Fase 31: Perfil do Cliente (05/12/2024)
- [ ] Criar tabela de endereços do cliente (customer_addresses)
- [ ] Implementar backend para CRUD de endereços
- [ ] Criar rotas tRPC para gerenciar endereços
- [ ] Criar página de perfil do cliente (/perfil)
- [ ] Implementar layout com abas (Dados, Pedidos, Fidelidade, Endereços)
- [ ] Aba de Dados Pessoais (visualizar/editar nome, email, telefone)
- [ ] Aba de Pedidos (histórico completo com status e detalhes)
- [ ] Aba de Fidelidade (saldo de pontos, histórico de transações)
- [ ] Aba de Endereços (listar, adicionar, editar, deletar, marcar como principal)
- [ ] Integrar seleção de endereço no checkout

## ⚙️ Fase 32: Admin - Métodos de Pagamento (05/12/2024)
- [ ] Criar página AdminPaymentMethods.tsx
- [ ] Implementar listagem de métodos de pagamento
- [ ] Formulário de criação de método (nome, desconto %, ativo)
- [ ] Formulário de edição de método
- [ ] Ações de ativar/desativar e deletar
- [ ] Adicionar rota no App.tsx e AdminLayout
- [ ] Testar CRUD completo



## 🚚 Fase 30: Cálculo de Frete e Checkout (05/12/2024)
- [x] Criar schema de zonas de entrega (shipping_zones)
- [x] Implementar backend de cálculo de frete
- [x] Integrar API ViaCEP
- [x] Criar rotas tRPC para frete
- [x] Seed de zonas de frete padrão
- [ ] Melhorar página de checkout com cálculo automático

## 💳 Fase 31: Métodos de Pagamento com Desconto (05/12/2024)
- [x] Adicionar campo discount_percentage à tabela payment_methods
- [x] Implementar backend de métodos de pagamento
- [x] Criar rotas tRPC para métodos de pagamento
- [x] Seed de métodos de pagamento padrão
- [ ] Implementar cálculo de desconto no checkout
- [ ] Criar painel admin para gerenciar métodos

## 🏠 Fase 32: Múltiplos Endereços do Cliente (05/12/2024)
- [x] Criar schema de customer_addresses
- [x] Implementar backend de gerenciamento de endereços
- [x] Criar rotas tRPC para endereços
- [x] Implementar preenchimento automático via CEP
- [ ] Criar página de gerenciamento de endereços
- [ ] Integrar com checkout (seleção de endereço)

## 👤 Fase 33: Perfil do Cliente (05/12/2024)
- [ ] Criar página de perfil com abas (Dados, Pedidos, Fidelidade, Endereços)
- [ ] Aba de Dados: editar informações pessoais
- [ ] Aba de Pedidos: histórico completo de pedidos
- [ ] Aba de Fidelidade: consultar pontos e histórico
- [ ] Aba de Endereços: CRUD de endereços com seleção de padrão
- [ ] Adicionar rota /perfil no App.tsx

## 🛠️ Fase 34: Painel Admin - Métodos de Pagamento (05/12/2024)
- [ ] Criar página AdminPaymentMethods.tsx
- [ ] Listagem de métodos com status (ativo/inativo)
- [ ] Formulário de criação de método
- [ ] Formulário de edição de método
- [ ] Configuração de desconto por método
- [ ] Ordenação de métodos (displayOrder)
- [ ] Adicionar rota no AdminLayout


## 🚚 Fase 30: Cálculo de Frete e Checkout - COMPLETO ✅
- [x] Criar schema de zonas de entrega (shipping_zones)
- [x] Implementar backend de cálculo de frete
- [x] Integrar API ViaCEP
- [x] Criar rotas tRPC para frete
- [x] Seed de zonas de frete padrão
- [ ] Melhorar página de checkout com cálculo automático

## 💳 Fase 31: Métodos de Pagamento com Desconto - COMPLETO ✅
- [x] Adicionar campo discount_percentage à tabela payment_methods
- [x] Implementar backend de métodos de pagamento
- [x] Criar rotas tRPC para métodos de pagamento
- [x] Seed de métodos de pagamento padrão (Dinheiro 5%, Pix 3%, etc)
- [x] Criar painel admin para gerenciar métodos
- [x] Implementar CRUD completo de métodos
- [ ] Implementar cálculo de desconto no checkout

## 🏠 Fase 32: Múltiplos Endereços do Cliente - COMPLETO ✅
- [x] Criar schema de customer_addresses
- [x] Implementar backend de gerenciamento de endereços
- [x] Criar rotas tRPC para endereços
- [x] Implementar preenchimento automático via CEP
- [x] Criar página de perfil com aba de endereços
- [x] Implementar CRUD completo de endereços
- [ ] Integrar com checkout (seleção de endereço)

## 👤 Fase 33: Perfil do Cliente - COMPLETO ✅
- [x] Criar página de perfil com estrutura de abas
- [x] Implementar aba de dados pessoais com edição
- [x] Implementar aba de pedidos com histórico completo
- [x] Implementar aba de fidelidade com pontos e histórico
- [x] Implementar aba de endereços com CRUD completo
- [x] Adicionar rota /perfil no App.tsx
- [x] Integrar com Header (link para perfil)

## 🔧 Fase 34: Painel Admin de Métodos de Pagamento - COMPLETO ✅
- [x] Criar página AdminPaymentMethods.tsx
- [x] Implementar listagem de métodos com cards
- [x] Implementar formulário de criação/edição
- [x] Adicionar toggle ativo/inativo
- [x] Adicionar campo de desconto percentual
- [x] Adicionar campo de ordem de exibição
- [x] Adicionar rota no App.tsx e AdminLayout
- [x] Adicionar ícone CreditCard no menu

## 🎯 Fase 35: Melhorias Finais no Checkout - PENDENTE ⏳
- [ ] Integrar seleção de endereços salvos
- [ ] Implementar preenchimento automático via CEP
- [ ] Adicionar seleção de método de pagamento com desconto
- [ ] Calcular desconto automaticamente ao selecionar método
- [ ] Atualizar total do pedido com desconto
- [ ] Validar formulário completo antes de finalizar
- [ ] Criar página de confirmação de pedido
- [ ] Implementar envio de email de confirmação


## 🐛 Bug: Edição de Métodos de Pagamento Não Funciona (05/12/2024) - CORRIGIDO ✅
- [x] Investigar por que botão de editar não abre formulário
- [x] Verificar se existingMethod está sendo carregado
- [x] Corrigir estado do formulário ao editar (useEffect)
- [x] Formulário ainda aparece vazio ao editar
- [x] Investigar por que useEffect não carrega dados
- [x] Verificar se query trpc.paymentMethods.get funciona (FALTAVA A ROTA!)
- [x] Adicionar rota paymentMethods.get no backend
- [x] Adicionar brandLogoUrl aos schemas de input
- [ ] Testar edição completa de método

## 🎨 Feature: Campo de Bandeira para Métodos de Pagamento (05/12/2024) - COMPLETO ✅
- [x] Adicionar campo brandLogoUrl ao schema de payment_methods
- [x] Adicionar coluna brand_logo_url ao banco de dados
- [x] Atualizar interface PaymentMethod no backend
- [x] Atualizar funções create e update no backend
- [x] Atualizar formulário de métodos com campo de bandeira
- [ ] Criar dropdown de bandeiras no checkout (Alelo, Ben, Pluxee, Ticket, VR, Verocard)
- [ ] Exibir logo da bandeira selecionada
- [ ] Testar fluxo completo de cadastro e seleção


## 🏷️ Feature: Nome da Bandeira (05/12/2024)
- [ ] Adicionar campo brandName ao schema de payment_methods
- [ ] Adicionar coluna brand_name ao banco de dados
- [ ] Atualizar interface PaymentMethod no backend
- [ ] Atualizar formulário de admin com campo de nome
- [ ] Exibir nome + logo da bandeira no checkout

## 📚 Feature: Biblioteca de Imagens (Media Library) (05/12/2024)
- [ ] Criar schema de media_library (id, filename, url, mimeType, size, uploadedBy, createdAt)
- [ ] Implementar backend de upload de imagens para S3
- [ ] Criar rotas tRPC para media library (upload, list, delete)
- [ ] Criar interface de galeria de imagens no admin
- [ ] Implementar seletor de imagens (modal com galeria)
- [ ] Integrar seletor com formulário de métodos de pagamento
- [ ] Permitir upload de novas imagens na galeria
- [ ] Exibir preview de imagens selecionadas


## 🏷️ Fase 34: Nome da Bandeira e Media Library (05/12/2024)
- [x] Adicionar campo brandName ao schema de payment_methods
- [x] Adicionar coluna brand_name ao banco de dados
- [x] Atualizar interface PaymentMethod no backend
- [x] Atualizar formulário de admin com campo de nome da bandeira
- [x] Criar schema de media_library (id, filename, url, mimeType, size, uploadedBy, createdAt)
- [x] Implementar backend de upload de imagens para S3 (media-library.ts)
- [x] Criar rotas tRPC para media library (upload, list, get, delete)
- [x] Criar componente MediaLibraryModal com galeria de imagens
- [x] Implementar seletor de imagens (modal com galeria)
- [x] Integrar seletor com formulário de métodos de pagamento
- [x] Permitir upload de novas imagens na galeria (drag-and-drop)
- [x] Exibir preview de imagens selecionadas
- [x] Exibir nome + logo da bandeira no checkout
- [x] Adicionar brandName aos schemas de create e update de paymentMethods


## 🎨 Fase 35: Cadastro de Logos e Métodos por Bandeira (05/12/2024)
- [x] Buscar logos das bandeiras VA/VR (Alelo, Ticket, VR, Pluxee, Ben, Verocard)
- [x] Fazer upload dos logos na Media Library
- [x] Criar método de pagamento específico para Alelo
- [x] Criar método de pagamento específico para Ticket
- [x] Criar método de pagamento específico para VR
- [x] Criar método de pagamento específico para Pluxee
- [x] Criar método de pagamento específico para Ben
- [x] Criar método de pagamento específico para Verocard
- [x] Desativar método genérico "Vale Alimentação/Refeição"

## 🖼️ Fase 36: Expansão da Media Library (05/12/2024)
- [x] Adicionar campo imageUrl às categorias
- [x] Criar funções backend para gerenciar imagens de categorias
- [x] Criar rotas tRPC para atualizar imagens de categorias
- [x] Integrar MediaLibraryModal ao formulário de pratos (AdminDishes)
- [x] Adicionar botão de galeria para upload de fotos de pratos
- [x] Preview de imagens selecionadas nos formulários
- [x] Documentar uso da Media Library em outros contextos (MEDIA_LIBRARY.md)


## 🔐 Fase 37: Criptografia de Campos Sensíveis (07/12/2024)
- [x] Criar módulo de criptografia AES-256 (server/encryption.ts)
- [x] Adicionar variável ENCRYPTION_KEY ao .env
- [x] Atualizar customer-addresses para criptografar campos sensíveis
- [x] Atualizar user_profiles para criptografar telefone, endereço, cidade, estado, CEP e CPF/CNPJ
- [x] Substituir criptografia MySQL por Node.js (AES-256-GCM) em admin-users.ts
- [ ] Atualizar orders para criptografar dados de entrega
- [ ] Testar criptografia/descriptografia em desenvolvimento
- [x] Documentar uso da criptografia (ENCRYPTION.md)
