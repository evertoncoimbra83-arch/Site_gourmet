# 🏁 Arquitetura do Checkout (PIN)

## 📌 Visão Geral
O Checkout é o estágio final onde o `cart` (ativo) é transformado em um `order` (pedido). Ele depende diretamente da integridade dos totais calculados no Carrinho.

## 🛠️ Componentes Críticos

### 1. Servidor: `server/routers/checkout/index.ts`
- **Responsabilidade**: Validar estoque, processar pagamento e finalizar a venda.
- **Lógica de Transição**: Deve ler o `discountValue` e o `couponCode` confirmados no carrinho para aplicar no valor final do pedido.
- **Segurança**: Verifica se o usuário tem um endereço de entrega selecionado ou se optou por retirada.

### 2. Fluxo de Tabelas (DB)
- **Carts**: Tabela de origem (status muda de 'active' para 'completed').
- **Orders**: Tabela de destino (herda o `total`, `discountValue` e `couponCode`).
- **OrderItems**: Herda todos os itens, incluindo a estrutura de pacotes/acompanhamentos.

### 3. Frontend: `client/src/pages/checkout/`
- **Página Principal**: Coordena a seleção de endereço e método de pagamento.
- **Hooks**: `useCheckoutTracking.ts` monitora o funil de conversão.

## 📈 Regras de Integridade
- **Consistência**: O valor final cobrado no Checkout **deve ser idêntico** ao valor exibido no `CartSummary`.
- **Limpeza**: Após a criação do pedido com sucesso, o `cartId` no `localStorage` deve ser invalidado ou o status deve ser fechado para evitar duplicidade.

## ⚠️ Pontos de Atenção para Ajustes
- **Taxa de Entrega**: Deve ser somada após todos os descontos de cupom (ou conforme regra de negócio definida).
- **Status do Pedido**: Inicia sempre como 'pending' ou 'received'.