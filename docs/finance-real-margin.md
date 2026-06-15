# Fórmulas e Contrato de Margem Real — Gourmet Saudável

Este documento descreve as fórmulas e o contrato técnico de cálculo de margem real de contribuição (lucro bruto), servindo como base conceitual para o desenvolvimento do Dashboard Financeiro.

---

## 1. Fórmulas Financeiras

O motor de cálculo utiliza as equações consolidadas abaixo:

### 1.1. Receita Líquida
Calculada a partir da receita bruta deduzindo qualquer desconto (cupons, descontos automáticos ou de fidelidade).
$$\text{Receita Líquida} = \text{Receita Bruta} - \text{Descontos}$$

### 1.2. CPV (Custo do Produto Vendido)
Soma de todos os insumos e custos de fabricação multiplicada pela quantidade vendida.
$$\text{CPV} = (\text{Custo de Ingredientes} + \text{Custo de Embalagem} + \text{Custo de Acompanhamentos}) \times \text{Quantidade}$$

### 1.3. Taxa de Intermediação de Pagamentos
Custo cobrado pelos gateways/adquirentes financeiros (cartão, pix, vale-refeição). Composto por taxa percentual sobre a receita líquida recebida mais taxa fixa por item transacionado.
$$\text{Taxa de Pagamento} = (\text{Receita Líquida} \times \frac{\text{Taxa Percentual}}{100}) + (\text{Taxa Fixa} \times \text{Quantidade})$$

### 1.4. Lucro Bruto / Margem de Contribuição
O lucro bruto que sobra de contribuição para pagar custos fixos da empresa após as deduções operacionais diretas (CPV, logística e gateway).
$$\text{Lucro Bruto} = \text{Receita Líquida} - \text{CPV} - \text{Taxa de Pagamento} - \text{Custo de Logística (Frete Real)}$$

### 1.5. Margem Percentual
Representa a porcentagem da receita que sobra como lucro bruto. Capped em `0` caso a receita líquida seja menor ou igual a `0`.
$$\text{Margem \%} = \frac{\text{Lucro Bruto}}{\text{Receita Líquida}} \times 100$$

---

## 2. Contrato Técnico (TypeScript)

Os tipos de dados definidos em [`server/finance/types.ts`](file:///f:/Site_React/server/finance/types.ts) são:

* **`MarginCalculationInput`**: Input com receita, descontos, composição de insumos, frete logístico real e taxas.
* **`MarginCalculationResult`**: Contém a receita bruta, descontos, receita líquida, CPV consolidado, taxas deduzidas, custos logísticos, custo total consolidated, lucro bruto, margem percentual e `warnings`.
* **`MarginWarning`**: Indica ausência de dados cruciais (como `missingIngredientCost`, `missingPackagingCost`, `missingPaymentFee`, `missingShippingCost`), receita zerada (`zeroRevenue`) ou margem de contribuição negativa (`negativeMargin`).

---

## 3. Lógica de Validação e Arredondamento
Todos os cálculos e retornos monetários passam pela função `roundMoney` para garantir precisão e arredondamento padrão para duas casas decimais, prevenindo imprecisões e erros do ponto flutuante Javascript (`NaN` e `Infinity`).
