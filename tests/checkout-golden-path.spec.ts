import { test, expect } from '@playwright/test';

test.describe('Golden Path: Fluxo de Vendas', () => {
  
  test('Deve conseguir adicionar um prato e finalizar o pedido sem erros 500', async ({ page }) => {
    // 1. Entra na página inicial da loja (ajuste a porta se necessário)
    await page.goto('http://localhost:5173');

    // 2. Espera os produtos carregarem e clica no primeiro prato disponível
    // Usando a classe CSS que você tem no card de produto
    const primeiroPrato = page.locator('.group.relative.cursor-pointer').first();
    await primeiroPrato.waitFor({ state: 'visible' });
    await primeiroPrato.click();

    // 3. O Drawer (Sheet) vai abrir. Vamos clicar no botão de Adicionar ao Carrinho
    // Ajuste o nome do botão se for diferente (ex: "Adicionar", "Comprar")
    const btnAdicionar = page.getByRole('button', { name: /adicionar/i });
    await btnAdicionar.waitFor({ state: 'visible' });
    await btnAdicionar.click();

    // 4. Abre o carrinho lateral
    // Assumindo que você tem um botão com ícone de carrinho ou texto
    await page.getByRole('button', { name: /carrinho/i }).click();

    // 5. Clica em Finalizar/Ir para Checkout
    await page.getByRole('button', { name: /finalizar/i }).click();

    // 6. Preenche os dados de entrega no Checkout
    // Aqui usamos um CEP real válido para passar na sua validação de Geofencing
    await page.getByPlaceholder('00000-000').fill('13202-251'); 
    
    // Preenche o restante (ajuste os placeholders conforme seu formulário real)
    await page.getByPlaceholder(/nome/i).fill('Testador Automático');
    await page.getByPlaceholder(/telefone/i).fill('11999999999');
    await page.getByPlaceholder(/número/i).fill('123');

    // 7. A MÁGICA ACONTECE AQUI: Interceptar a rota do tRPC
    // Vamos escutar a rede para garantir que a rota 'placeOrder' retorne 200 (Sucesso)
    const requestPromise = page.waitForResponse(
      (response) => 
        response.url().includes('store.checkout.placeOrder') && 
        response.request().method() === 'POST'
    );

    // 8. Clica no botão final de concluir pedido
    await page.getByRole('button', { name: /confirmar pedido/i }).click();

    // 9. Aguarda a resposta do servidor
    const response = await requestPromise;

    // 10. A Validação Final de Ouro (Atesta que não deu erro 500 igual aquele do SQL)
    expect(response.status()).toBe(200);

    // Opcional: Verifica se a tela redirecionou para a página de sucesso
    await expect(page.getByText(/pedido confirmado/i)).toBeVisible({ timeout: 10000 });
  });
});