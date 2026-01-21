# ⚖️ Regras de Negócio e Checkout

## Regras Atuais
1. **Prioridade de Desconto**: Desconto Progressivo (Automático) + Cupom (Manual).
2. **Persistência**: O Cupom deve ser gravado na tabela 'carts'.
3. **Mínimos**: O valor final do carrinho nunca deve ser inferior a R$ 0,00.
4. **Sincronia**: A UI deve invalidar o cache tRPC após qualquer alteração em cupons.
