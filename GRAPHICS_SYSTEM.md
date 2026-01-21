# Sistema de Grafismos e Overlays - Gourmet Saudável

## 📋 Visão Geral

O sistema de grafismos foi desenvolvido para melhorar a apresentação visual dos produtos **sem depender de múltiplas imagens**. Utiliza componentes React, SVG e CSS para criar efeitos visuais sofisticados e modernos.

---

## 🎨 Componentes Principais

### 1. **ProductImageOverlay**
Componente principal que encapsula toda a lógica de grafismos.

**Localização:** `client/src/components/ProductImageOverlay.tsx`

**Props:**
```typescript
interface ProductImageOverlayProps {
  imageUrl: string;                    // URL da imagem do produto
  productName: string;                 // Nome do produto
  isPromotion?: boolean;               // Mostra badge de promoção
  isNew?: boolean;                     // Mostra badge "Novo"
  isBestseller?: boolean;              // Mostra badge "Bestseller"
  attributes?: {
    isVegan?: boolean;                 // Ícone de vegano
    isGlutenFree?: boolean;            // Ícone de sem glúten
    highProtein?: boolean;             // Ícone de alto teor de proteína
  };
}
```

**Recursos:**
- ✅ Padrão geométrico SVG de fundo (pontos, linhas, etc.)
- ✅ Overlay de cor suave com hover
- ✅ Efeito de sombra 3D dinâmica
- ✅ Badges animados com gradientes
- ✅ Ícones informativos com backdrop blur
- ✅ Efeito de brilho (shine effect) ao hover
- ✅ Zoom suave na imagem ao hover

**Exemplo de uso:**
```tsx
<ProductImageOverlay
  imageUrl="/path/to/image.jpg"
  productName="Marmita Fit Premium"
  isPromotion={true}
  isNew={false}
  isBestseller={true}
  attributes={{
    isVegan: true,
    isGlutenFree: false,
    highProtein: true,
  }}
/>
```

---

### 2. **ProductBadge**
Componente reutilizável para badges com múltiplos tipos.

**Localização:** `client/src/components/ProductBadge.tsx`

**Tipos disponíveis:**
- `promotion` - Promoção (com ícone de chama)
- `new` - Novo (com ícone de brilho)
- `bestseller` - Bestseller (com ícone de troféu)
- `vegan` - Vegano (com ícone de folha)
- `glutenFree` - Sem Glúten (com ícone de raio)
- `highProtein` - Alto Teor de Proteína (com ícone de coração)
- `limited` - Edição Limitada (com ícone de chama)

**Exemplo de uso:**
```tsx
<ProductBadge type="promotion" animated={true} />
<ProductBadge type="vegan" />
<ProductBadge type="bestseller" label="Top Vendido" />
```

---

### 3. **GeometricPatterns**
Componentes de padrões geométricos SVG reutilizáveis.

**Localização:** `client/src/components/GeometricPatterns.tsx`

**Padrões disponíveis:**
- `dots` - Padrão de pontos
- `grid` - Grade geométrica
- `lines` - Linhas cruzadas
- `waves` - Ondas suaves
- `hexagon` - Hexágonos
- `circles` - Círculos concêntricos

**Exemplo de uso:**
```tsx
<PatternBackground
  patternType="dots"
  opacity={0.05}
  color="currentColor"
/>
```

---

## 🎯 Integração com ProductCard

O componente `ProductCard` foi atualizado para usar automaticamente o `ProductImageOverlay`.

**Fluxo de dados:**

```
Product (WooCommerce)
    ↓
ProductCard
    ↓
ProductImageOverlay
    ├─ Padrão SVG
    ├─ Badges dinâmicos
    ├─ Ícones informativos
    ├─ Overlay de cor
    └─ Efeitos de hover
```

**Extração automática de atributos:**

O `ProductCard` extrai automaticamente atributos do produto usando `meta_data`:

```typescript
function extractProductAttributes(product: Product) {
  // Procura por palavras-chave em meta_data
  // vegan, gluten, protein
}
```

---

## 🎨 Paleta de Cores Utilizada

| Elemento | Cor | Valor OKLCH |
|----------|-----|-----------|
| **Primária** | Verde Esmeralda | `oklch(0.35 0.08 160)` |
| **Secundária** | Amarelo Dourado | `oklch(0.65 0.18 50)` |
| **Acentuada** | Verde Claro | `oklch(0.50 0.10 160)` |
| **Fundo** | Branco | `oklch(1 0 0)` |
| **Texto** | Cinza Carvão | `oklch(0.22 0.02 160)` |

---

## ✨ Efeitos Visuais Implementados

### 1. **Padrão Geométrico de Fundo**
- SVG com padrão sutil (pontos, linhas, etc.)
- Opacidade controlável
- Adiciona profundidade sem poluição visual

### 2. **Overlay de Cor Suave**
- Cor primária (Verde Esmeralda) com transparência
- Ativa ao hover
- Transição suave

### 3. **Efeito de Sombra 3D**
- Sombra base constante
- Aumenta ao hover
- Cria ilusão de profundidade

### 4. **Badges Animados**
- Gradientes de cores
- Animação pulse para promoções
- Ícones integrados

### 5. **Ícones Informativos**
- Backdrop blur para legibilidade
- Posicionados no canto inferior esquerdo
- Hover effect para destaque

### 6. **Efeito de Brilho (Shine Effect)**
- Animação de brilho ao hover
- Cria efeito de profundidade
- Duração: 1 segundo

### 7. **Zoom na Imagem**
- Zoom suave ao hover (escala 1.1)
- Transição de 500ms
- Efeito de aproximação

---

## 🔧 Customização

### Modificar cores dos badges

Edite `ProductBadge.tsx`:

```typescript
const badgeConfig: Record<BadgeType, ...> = {
  promotion: {
    gradient: "from-secondary to-yellow-500", // Customize aqui
    ...
  },
  ...
};
```

### Modificar padrões geométricos

Edite `GeometricPatterns.tsx` para adicionar novos padrões:

```typescript
export function CustomPattern({ patternId, opacity, color }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      {/* Seu padrão SVG aqui */}
    </pattern>
  );
}
```

### Modificar opacidade do overlay

Em `ProductImageOverlay.tsx`:

```typescript
// Altere este valor para controlar a opacidade do padrão
<svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none">
```

---

## 📱 Responsividade

Todos os componentes são totalmente responsivos:

- **Mobile (< 640px):** Badges e ícones redimensionam automaticamente
- **Tablet (640px - 1024px):** Layout otimizado
- **Desktop (> 1024px):** Efeitos completos com hover

---

## 🚀 Performance

- **SVG otimizado:** Padrões renderizados uma única vez
- **CSS Transitions:** Efeitos suaves sem JavaScript
- **Lazy loading:** Imagens carregadas sob demanda
- **Sem dependências externas:** Apenas React e Tailwind

---

## 🧪 Testes

Para testar os grafismos:

1. Navegue até a página de produtos: `/produtos`
2. Observe os efeitos de hover nas imagens
3. Verifique a renderização dos badges e ícones
4. Teste em diferentes tamanhos de tela

---

## 📝 Notas Importantes

- **Limitação de imagens:** O sistema foi projetado para funcionar com imagens de baixa qualidade ou limitadas
- **Compatibilidade:** Funciona em todos os navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Acessibilidade:** Todos os ícones possuem atributos `title` para leitores de tela
- **SEO:** Não afeta SEO, pois usa apenas CSS e SVG

---

## 🔄 Próximos Passos

- [ ] Adicionar animações mais complexas (parallax, 3D transforms)
- [ ] Criar variações de padrões por categoria
- [ ] Implementar temas customizáveis por produto
- [ ] Adicionar suporte a vídeos como alternativa a imagens

---

**Versão:** 1.0  
**Última atualização:** 2025-01-14  
**Autor:** Manus AI
