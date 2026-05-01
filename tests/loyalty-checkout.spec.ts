import { test, expect } from '@playwright/test';

test.describe('Validação de Regras de Negócio - Checkout & Lealdade', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Vai para a Home
    await page.goto('/');

    // 2. Aceita os cookies para desobstruir a interface
    const cookieButton = page.getByRole('button', { name: 'ACEITAR TODOS' });
    if (await cookieButton.isVisible()) {
      await cookieButton.click();
    }

    // 3. Navega para a página de produtos
    // ✅ REVISÃO: Filtramos pelo container 'navigation' (Header) para evitar conflito com o link do Footer
    await page.getByRole('navigation').getByRole('link', { name: 'Cardápio', exact: true }).click();
    
    // Espera a navegação concluir
    await expect(page).toHaveURL(/\/produtos/);
  });

  test('Deve aplicar desconto progressivo ao adicionar múltiplos itens', async ({ page }) => {
    // Localiza o botão "Adicionar" do primeiro produto visível
    const addButton = page.getByRole('button', { name: /Adicionar/i }).first();
    await expect(addButton).toBeVisible();
    
    // 1. Adiciona a primeira unidade
    await addButton.click();
    
    // Captura o localizador do preço (Certifique-se que .cart-total-price é a classe do seu resumo)
    const cartPriceLocator = page.locator('.cart-total-price').first();
    
    // Aguarda o carrinho processar o primeiro item
    await expect(cartPriceLocator).toBeVisible();
    const priceText = await cartPriceLocator.textContent();
    const initialPrice = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');

    // 2. Adiciona mais 2 unidades do mesmo produto
    await addButton.click();
    await addButton.click();

    // ✅ REVISÃO: Pequena espera para o cálculo do tRPC/React estabilizar no DOM
    await page.waitForTimeout(500); 

    const finalPriceText = await cartPriceLocator.textContent();
    const finalPrice = parseFloat(finalPriceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');

    // ✅ VALIDAÇÃO: Se o desconto progressivo existe, o preço total de 3 itens < (preço de 1 item * 3)
    expect(finalPrice).toBeLessThan(initialPrice * 3);
  });

  test('Deve exibir ganho de pontos de fidelidade no resumo do pedido', async ({ page }) => {
    // 1. Adiciona um produto para gerar pontos
    await page.getByRole('button', { name: /Adicionar/i }).first().click();
    
    // 2. Navega para a página final do carrinho
    await page.goto('/carrinho');

    // 3. Busca por texto de pontos ou fidelidade (Regex flexível)
    const loyaltyText = page.locator('text=/pontos|fidelidade/i').first();
    
    // Garante que a informação de lealdade apareceu
    await expect(loyaltyText).toBeVisible();
    
    const content = await loyaltyText.textContent();
    
    // ✅ VALIDAÇÃO: Garante que o cálculo foi feito e não exibe "0"
    expect(content).not.toContain(' 0 ');
    expect(content).not.toBeNull();
  });
});