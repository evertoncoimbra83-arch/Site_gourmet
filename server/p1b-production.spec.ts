import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  isAllowedSdkHost,
  shouldInitializeClientSdk,
} from "../client/src/app/logic/sdkGuards";
import { isLocalPrintTransportAllowed } from "../client/src/pages/adminLabelEditor/print-engine/transportGuards";
import { AdminOrdersMobileList } from "../client/src/pages/adminOrders/view/AdminOrdersMobileList";

describe("Sprint P1-B producao", () => {
  it("bloqueia transporte local de impressao em producao", () => {
    expect(
      isLocalPrintTransportAllowed({
        hostname: "gourmetsaudavel.com.br",
        isDev: false,
      })
    ).toBe(false);
    expect(
      isLocalPrintTransportAllowed({
        hostname: "127.0.0.1",
        isDev: false,
      })
    ).toBe(false);
    expect(
      isLocalPrintTransportAllowed({
        hostname: "127.0.0.1",
        isDev: true,
      })
    ).toBe(true);
  });

  it("aceita dominios reais de producao para SDK", () => {
    expect(isAllowedSdkHost("gourmetsaudavel.com")).toBe(true);
    expect(isAllowedSdkHost("www.gourmetsaudavel.com")).toBe(true);
    expect(isAllowedSdkHost("gourmetsaudavel.com.br")).toBe(true);
    expect(isAllowedSdkHost("www.gourmetsaudavel.com.br")).toBe(true);
  });

  it("nao inicializa SDK em dominio invalido ou rota admin", () => {
    expect(
      shouldInitializeClientSdk({
        hostname: "preview.invalid",
        pathname: "/",
      })
    ).toBe(false);
    expect(
      shouldInitializeClientSdk({
        hostname: "gourmetsaudavel.com.br",
        pathname: "/admin/orders",
      })
    ).toBe(false);
  });

  it("renderiza pedidos no estado mobile do Admin Orders", () => {
    const html = renderToStaticMarkup(
      React.createElement(AdminOrdersMobileList, {
        orders: [
          {
            id: "123456789",
            status: "pending",
            customerName: "Cliente Mobile",
            customerPhone: "11999999999",
            total: "89.90",
          },
        ],
        selectedIds: [],
        isEditing: false,
        isDeleting: false,
        onToggleSelect: vi.fn(),
        onOpenOrder: vi.fn(),
        onEditOrder: vi.fn(),
        onDeleteOrder: vi.fn(),
      })
    );

    expect(html).toContain("Cliente Mobile");
    expect(html).toContain("#23456789");
    expect(html).toContain("Pendente");
  });

  it("falha de SDK/analytics fica isolada das regras de pedidos admin", () => {
    expect(
      shouldInitializeClientSdk({
        hostname: "gourmetsaudavel.com.br",
        pathname: "/admin/orders",
      })
    ).toBe(false);
  });
});
