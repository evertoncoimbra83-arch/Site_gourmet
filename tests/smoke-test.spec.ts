import { expect, test, type Locator, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const BRIDGE_TOKEN =
  process.env.BRIDGE_TOKEN || process.env.INTERNAL_INTEGRATION_TOKEN || "";

async function acceptCookiesIfPresent(page: Page) {
  const acceptButton = page
    .getByRole("button", { name: /aceitar todos|aceitar/i })
    .first();

  if (await acceptButton.isVisible({ timeout: 2_500 }).catch(() => false)) {
    await acceptButton.click();
  }
}

async function openFirstDish(page: Page) {
  const firstDishCard = page.getByText("Ver Prato").first();
  await expect(firstDishCard).toBeVisible({ timeout: 15_000 });
  await firstDishCard.click();

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await expect(drawer.getByText(/Escolha o Tamanho/i)).toBeVisible();

  return drawer;
}

async function chooseFirstSize(drawer: Locator) {
  const sizeButton = drawer
    .locator("button")
    .filter({ hasText: /\d+\s*g/i })
    .first();

  await expect(sizeButton).toBeVisible({ timeout: 10_000 });
  await sizeButton.click();
}

async function chooseRequiredAccompaniments(page: Page, drawer: Locator) {
  const comboCount = await drawer.getByRole("combobox").count();

  for (let index = 0; index < comboCount; index += 1) {
    const combobox = drawer.getByRole("combobox").nth(index);
    await combobox.click();
    await page.getByRole("option").first().click();
  }
}

test.describe("Gourmet Saudavel Smoke Test", () => {
  test("catalog loads from home and opens the product details modal", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await acceptCookiesIfPresent(page);

    await expect(
      page.getByRole("heading", { name: /Natural por/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver Card/i })).toBeVisible();

    await page.getByRole("link", { name: /Ver Card/i }).click();
    await expect(page).toHaveURL(/\/produtos$/);

    const drawer = await openFirstDish(page);
    await expect(drawer.getByText(/Personalize seu/i)).toBeVisible();
  });

  test("purchase flow adds a dish to cart and reaches the checkout entry point", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/produtos`, { waitUntil: "domcontentloaded" });
    await acceptCookiesIfPresent(page);

    const drawer = await openFirstDish(page);
    await chooseFirstSize(drawer);
    await chooseRequiredAccompaniments(page, drawer);

    const addToCartButton = drawer.getByRole("button", {
      name: /Adicionar ao Carrinho/i,
    });

    await expect(addToCartButton).toBeEnabled({ timeout: 10_000 });
    await addToCartButton.click();

    await page.goto(`${BASE_URL}/carrinho`, { waitUntil: "domcontentloaded" });

    const finalizeButton = page.getByRole("button", {
      name: /Finalizar Pedido/i,
    });

    await expect(finalizeButton).toBeVisible({ timeout: 15_000 });
    await finalizeButton.click();

    await expect(page).toHaveURL(/\/finalizar-pedido$/);

    const checkoutHeader = page.getByRole("heading", { name: /Checkout/i });
    const loginGateButton = page.getByRole("button", {
      name: /tenho conta|Entrar/i,
    });

    await expect
      .poll(
        async () =>
          (await checkoutHeader.isVisible().catch(() => false)) ||
          (await loginGateButton.isVisible().catch(() => false)),
        { timeout: 15_000 }
      )
      .toBe(true);
  });

  test("integration.getInventory returns 200 with the security token", async ({
    request,
  }) => {
    test.skip(
      !BRIDGE_TOKEN,
      "Set BRIDGE_TOKEN or INTERNAL_INTEGRATION_TOKEN to validate the protected integration endpoint."
    );

    const response = await request.get(`${BASE_URL}/trpc/integration.getInventory`, {
      headers: {
        Authorization: `Bearer ${BRIDGE_TOKEN}`,
      },
    });

    expect(response.status()).toBe(200);
  });

  test("admin login loads the email and password fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 10_000,
    });
  });
});
