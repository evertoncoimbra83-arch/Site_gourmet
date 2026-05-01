import { expect, test, type Locator, type Page } from "@playwright/test";

const APP_URL = "http://localhost:5173";
const ADMIN_EMAIL = "gourmetsaudaveladm@gmail.com";
const ADMIN_PASSWORD = "C@ralho6486";
async function dismissCookieBanner(page: Page) {
  const acceptButton = page
    .locator("button, a")
    .filter({ hasText: /aceitar|concordar/i })
    .first();

  if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptButton.click({ force: true });
    await page.waitForTimeout(300);
  }
}

async function loginAsAdmin(page: Page) {
  await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });

  await page
    .locator('input[type="text"], input[type="email"]')
    .first()
    .fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);

  await page
    .getByRole("button", { name: /entrar no sistema|entrar/i })
    .first()
    .click();

  await page.waitForLoadState("networkidle");
  await dismissCookieBanner(page);
}

async function openProductDrawer(page: Page): Promise<Locator> {
  console.log("Tentando abrir drawer...");

  const openButton = page.getByTestId("btn-ver-prato").first();

  try {
    await expect(openButton).toBeVisible({ timeout: 10000 });
  } catch (error) {
    await page.screenshot({ path: "erro-cardapio.png", fullPage: true });
    throw error;
  }

  await openButton.click({ force: true });

  const drawer = page.getByTestId("drawer-prato");
  await expect(drawer).toBeVisible({ timeout: 10000 });
  console.log("Drawer detectado...");

  return drawer;
}

async function selectFirstSize(drawer: Locator) {
  const sizeButton = drawer
    .locator("button")
    .filter({ hasText: /300g|400g|\d+\s*g/i })
    .first();

  await expect(sizeButton).toBeVisible({ timeout: 10000 });
  await sizeButton.click();
  await drawer.page().waitForTimeout(500);
  console.log("Tamanho selecionado...");
}

async function selectRequiredAccompaniments(page: Page, drawer: Locator) {
  const comboboxes = drawer.getByRole("combobox");
  const comboCount = await comboboxes.count();

  for (let index = 0; index < comboCount; index += 1) {
    await comboboxes.nth(index).click();
    await page.getByRole("option").first().click();
    await page.waitForTimeout(500);
    console.log(`Acompanhamento ${index + 1} selecionado...`);
  }
}

async function goToCheckout(page: Page) {
  await page.goto(`${APP_URL}/carrinho`, { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);

  const cartFinalizeButton = page.getByRole("button", {
    name: /Finalizar Pedido/i,
  });

  await expect(cartFinalizeButton).toBeVisible({ timeout: 15000 });
  await cartFinalizeButton.click();

  await expect(page).toHaveURL(/\/finalizar-pedido$/, { timeout: 15000 });
}

async function selectPaymentAndFinalize(page: Page) {
  const paymentOptions = page.getByTestId("payment-method-option");
  await expect(paymentOptions.first()).toBeVisible({ timeout: 15000 });
  console.log("Metodo de pagamento detectado...");
  await paymentOptions.first().click();

  const finalizeOrderButton = page.getByTestId("btn-finalize-order");
  await expect(finalizeOrderButton).toBeVisible({ timeout: 15000 });
  await expect(finalizeOrderButton).toBeEnabled({ timeout: 15000 });
  console.log("Botao final do pedido habilitado...");
  await finalizeOrderButton.click();

  await expect(page.getByTestId("order-success-container")).toBeVisible({
    timeout: 30000,
  });
}

test.describe("Golden Path: Fluxo de Vendas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("deve conseguir adicionar um prato e chegar ao checkout logado", async ({
    page,
  }) => {
    test.setTimeout(90000);

    await page.goto(`${APP_URL}/produtos`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    const drawer = await openProductDrawer(page);
    await selectFirstSize(drawer);
    await selectRequiredAccompaniments(page, drawer);

    const addToCartButton = drawer.getByTestId("btn-add-carrinho");
    await expect(addToCartButton).toBeEnabled({ timeout: 10000 });
    console.log("Botao adicionar habilitado...");
    await addToCartButton.click();

    await goToCheckout(page);
    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible();
  });

  test("deve avancar do checkout preenchido ate a confirmacao do pedido", async ({
    page,
  }) => {
    test.setTimeout(90000);

    await page.goto(`${APP_URL}/produtos`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    const drawer = await openProductDrawer(page);
    await selectFirstSize(drawer);
    await selectRequiredAccompaniments(page, drawer);

    const addToCartButton = drawer.getByTestId("btn-add-carrinho");
    await expect(addToCartButton).toBeEnabled({ timeout: 10000 });
    console.log("Botao adicionar habilitado...");
    await addToCartButton.click();

    await goToCheckout(page);
    await expect(page.getByRole("heading", { name: /Checkout/i })).toBeVisible({
      timeout: 15000,
    });
    await selectPaymentAndFinalize(page);
  });
});
