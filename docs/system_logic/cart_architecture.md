# 🏗️ Arquitetura do Carrinho

Gerado: 06/01/2026, 21:47:43

## Status das Funções
- **applyCoupon**: ✅ Ativo
- **removeCoupon**: ✅ Ativo
- **syncCartState**: ✅ Integrado

## Fluxo de Sincronia
O sistema utiliza `syncCartState` para processar itens complexos e injeta manualmente o `discountValue` do DB no `getSummary`.
