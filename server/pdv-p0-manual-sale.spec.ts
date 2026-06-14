import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getManualSaleStartupState } from "../client/src/pages/adminOrders/logic/manualSaleState";
import {
  getManualSaleDraftQueryInput,
  mergeDraftItemsById,
} from "../client/src/pages/adminOrders/logic/draftCache";
import { AdminOrdersMobileList } from "../client/src/pages/adminOrders/view/AdminOrdersMobileList";
import { ordersAdminRouter } from "./routers/admin/orders/ordersAdminRouter";
import AdminPdvDisabled from "../client/src/pages/AdminPdvDisabled";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Sprint PDV P0 Venda Manual", () => {
  it("existe endpoint de init e rascunho para Venda Manual", () => {
    const procedures = Object.keys((ordersAdminRouter as any)._def.procedures);

    expect(procedures).toContain("init");
    expect(procedures).toContain("getDraft");
    expect(procedures).toContain("updateSession");
    expect(procedures).toContain("placeOrder");
  });

  it("nao deixa /admin/orders/create preso sem draftId", () => {
    expect(
      getManualSaleStartupState({
        draftId: null,
        wizardLoading: false,
        initPending: false,
        initError: false,
        wizardError: false,
      }),
    ).toBe("initializing");

    expect(
      getManualSaleStartupState({
        draftId: "draft-1",
        wizardLoading: false,
        initPending: false,
        initError: false,
        wizardError: false,
      }),
    ).toBe("ready");
  });

  it("erro auxiliar vira estado de erro, nao loading infinito", () => {
    expect(
      getManualSaleStartupState({
        draftId: "draft-1",
        wizardLoading: false,
        initPending: false,
        initError: false,
        wizardError: true,
      }),
    ).toBe("error");
  });

  it("menu usa Venda Manual e nao aponta para Comandas", () => {
    const source = readProjectFile("client/src/components/AdminLayout.tsx");

    expect(source).toContain("Venda Manual");
    expect(source).toContain('href: "/admin/orders/create"');
    expect(source).not.toContain('href: "/admin/pdv"');
    expect(source).not.toContain("PDV & Caixa");
  });

  it("rotas diretas de Comandas mostram tela desativada", () => {
    const source = readProjectFile("client/src/app/logic/routesConfig.tsx");

    expect(source).toContain('path: "pdv"');
    expect(source).toContain("AdminPdvDisabled");
    expect(source).not.toContain('import("../../pages/AdminPdv")');
    expect(source).not.toContain('import("../../pages/AdminPdvComanda")');
    expect(source).not.toContain('import("../../pages/AdminPdvRelatorios")');
  });

  it("pagina direta de Comandas orienta para Venda Manual", () => {
    const html = renderToStaticMarkup(React.createElement(AdminPdvDisabled));

    expect(html).toContain("Comandas Salão temporariamente desativado");
    expect(html).toContain("Venda Manual");
  });

  it("mobile de pedidos usa acao de edicao sem label PDV", () => {
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
      }),
    );

    expect(html).toContain("Editar");
    expect(html).not.toContain(">PDV<");
  });

  it("usa a mesma chave de draft para leitura e invalidação imediata", () => {
    expect(getManualSaleDraftQueryInput("draft-123")).toEqual({
      draftId: "draft-123",
    });

    const source = readProjectFile(
      "client/src/pages/adminOrders/view/steps/StepItems.tsx",
    );

    expect(source).toContain("trpc.useUtils()");
    expect(source).toContain("getManualSaleDraftQueryInput(draftId)");
    expect(source).toContain("getDraft.invalidate(draftQueryInput");
    expect(source).toContain("onSuccess: async ()");
    expect(source).toContain("await refetchDraft()");
    expect(source).not.toContain("ordersAdmin.getDraft.invalidate()");
  });

  it("nao duplica item apos refetch do draft", () => {
    const merged = mergeDraftItemsById(
      [{ id: "item-1", name: "Prato" }],
      [
        { id: "item-1", name: "Prato atualizado" },
        { id: "item-2", name: "Pacote" },
      ],
    );

    expect(merged).toEqual([
      { id: "item-1", name: "Prato atualizado" },
      { id: "item-2", name: "Pacote" },
    ]);
  });
});
