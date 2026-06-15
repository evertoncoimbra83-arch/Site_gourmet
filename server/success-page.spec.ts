import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const successPageMock = vi.hoisted(() => ({
  storeInfo: {
    success_order_message:
      "Seu pedido foi recebido! Agora nossa equipe vai preparar tudo com muito carinho.",
    whatsapp: "11999999999",
    partners_json: JSON.stringify([
      {
        name: "Parceiro Fit",
        link: "https://example.com",
        discount_text: "10% OFF",
      },
    ]),
  },
  orderQuery: {
    data: undefined as unknown,
    isLoading: false,
    error: null as { data?: { code?: string } } | null,
    refetch: () => undefined,
  },
  loyaltyPointsData: undefined as unknown,
  loyaltySettings: undefined as unknown,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => React.createElement("div", props, children),
  },
}));

vi.mock("@/components/SEO", () => ({
  SEO: ({ title }: { title: string }) =>
    React.createElement("span", { "data-seo-title": title }),
}));

vi.mock("@/_core/trpc", () => ({
  trpc: {
    public: {
      getStoreSettings: {
        useQuery: () => ({ data: successPageMock.storeInfo }),
      },
    },
    orders: {
      getById: {
        useQuery: () => successPageMock.orderQuery,
      },
    },
    loyalty: {
      getPoints: {
        useQuery: () => ({ data: successPageMock.loyaltyPointsData }),
      },
      getSettings: {
        useQuery: () => ({ data: successPageMock.loyaltySettings }),
      },
    },
  },
}));

import SuccessPage from "../client/src/pages/SuccessPage";

function renderSuccessPage(path = "/sucesso?orderId=ORDER123456789") {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(SuccessPage)
    )
  );
}

describe("SuccessPage", () => {
  beforeEach(() => {
    successPageMock.storeInfo = {
      success_order_message:
        "Seu pedido foi recebido! Agora nossa equipe vai preparar tudo com muito carinho.",
      whatsapp: "11999999999",
      partners_json: JSON.stringify([
        {
          name: "Parceiro Fit",
          link: "https://example.com",
          discount_text: "10% OFF",
        },
      ]),
    };
    successPageMock.orderQuery = {
      data: undefined,
      isLoading: false,
      error: null,
      refetch: () => undefined,
    };
    successPageMock.loyaltyPointsData = undefined;
    successPageMock.loyaltySettings = undefined;
  });

  it("renderiza sucesso com resumo, pagamento, parceiros e botoes principais", () => {
    successPageMock.orderQuery = {
      data: {
        customerName: "Maria Cliente",
        total: "89.9",
        paymentMethod: "Pix",
        pointsEarned: 9,
        items: [
          {
            id: "item-1",
            quantity: 2,
            dishName: "Marmita Fit",
            totalPrice: "59.90",
            options: JSON.stringify({
              selectedSizeName: "Grande",
              selectedAccs: [{ name: "Arroz integral", weight: 80 }],
            }),
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: () => undefined,
    };
    successPageMock.loyaltyPointsData = {
      current_points: 120,
    };
    successPageMock.loyaltySettings = {
      enabled: true,
      redemptionRatePoints: 100,
      redemptionRateMoney: 5,
    };

    const html = renderSuccessPage();

    expect(html).toContain("Pedido");
    expect(html).toContain("Confirmado!");
    expect(html).toContain("Maria");
    expect(html).toContain("Total a Pagar");
    expect(html).toContain("Pix");
    expect(html).toContain("Marmita Fit");
    expect(html).toContain("Porcao: Grande");
    expect(html).toContain("Fidelidade");
    expect(html).toContain("Meus Pedidos");
    expect(html).toContain("Agendar no WhatsApp");
    expect(html).toContain("Parceiro Fit");
  });

  it("preserva o estado loading", () => {
    successPageMock.orderQuery = {
      data: undefined,
      isLoading: true,
      error: null,
      refetch: () => undefined,
    };

    const html = renderSuccessPage();

    expect(html).toContain("Carregando pedido");
    expect(html).toContain("Estamos buscando os detalhes do seu pedido");
    expect(html).toContain("Meus Pedidos");
  });

  it("preserva o estado de erro inesperado", () => {
    successPageMock.orderQuery = {
      data: undefined,
      isLoading: false,
      error: { data: { code: "INTERNAL_SERVER_ERROR" } },
      refetch: () => undefined,
    };

    const html = renderSuccessPage();

    expect(html).toContain("Falha na consulta");
    expect(html).toContain("Tentar Novamente");
  });

  it("preserva o estado de pedido nao encontrado", () => {
    successPageMock.orderQuery = {
      data: undefined,
      isLoading: false,
      error: { data: { code: "NOT_FOUND" } },
      refetch: () => undefined,
    };

    const html = renderSuccessPage();

    expect(html).toContain("Pedido nao encontrado");
    expect(html).toContain("Nao encontramos este pedido");
  });

  it("preserva a rota existente via fachada", () => {
    const routesConfig = fs.readFileSync(
      "client/src/app/logic/routesConfig.tsx",
      "utf8"
    );
    const facade = fs.readFileSync("client/src/pages/SuccessPage.tsx", "utf8");

    expect(routesConfig).toContain('path: "/sucesso"');
    expect(routesConfig).toContain('import("../../pages/SuccessPage")');
    expect(facade).toContain('export { default } from "./success/SuccessPage"');
  });
});
