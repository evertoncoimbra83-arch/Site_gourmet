import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const migratedFiles = [
  "client/src/pages/adminOrders/view/steps/OrderCheckoutSidebar.tsx",
  "client/src/pages/adminOrders/view/AdminOrderCreate.tsx",
  "client/src/pages/adminOrders/view/AdminOrdersView.tsx",
  "client/src/pages/adminMedia/logic/useAdminMedia.ts",
  "client/src/pages/adminMedia/view/AdminMediaView.tsx",
  "client/src/pages/adminLoyalty/logic/useAdminLoyalty.ts",
  "client/src/pages/adminLoyalty/view/AdminLoyaltyView.tsx",
  "client/src/pages/adminLoyalty/components/LoyaltyBalanceReconciliation.tsx",
  "client/src/pages/adminUsers/view/AdminUsersView.tsx",
  "client/src/pages/adminUsers/logic/useAdminUserAddress.ts",
  "client/src/pages/adminUsers/components/UserTabs/AddressesTab.tsx",
];

describe("Sprint Alertas P1 ConfirmDialog", () => {
  it("declara titulo, descricao e labels configuraveis", () => {
    const source = readProjectFile("client/src/components/ui/ConfirmDialog.tsx");

    expect(source).toContain("title: string");
    expect(source).toContain("description?: string");
    expect(source).toContain('confirmLabel = "Confirmar"');
    expect(source).toContain('cancelLabel = "Cancelar"');
    expect(source).toContain("{title}");
    expect(source).toContain("{description}");
    expect(source).toContain("{confirmLabel}");
    expect(source).toContain("{cancelLabel}");
  });

  it("expõe contrato de cancelamento, confirmacao, destrutivo e loading", () => {
    const source = readProjectFile("client/src/components/ui/ConfirmDialog.tsx");

    expect(source).toContain("onCancel: () => void");
    expect(source).toContain("onConfirm: ");
    expect(source).toContain("destructive?: boolean");
    expect(source).toContain("loading?: boolean");
    expect(source).toContain("disabled={loading}");
    expect(source).toContain("bg-red-600");
    expect(source).toContain("onEscapeKeyDown");
  });

  it("arquivos migrados usam ConfirmDialog e nao usam confirm nativo", () => {
    const migratedSource = migratedFiles
      .map((file) => readProjectFile(file))
      .join("\n");

    expect(migratedSource).toContain("ConfirmDialog");
    expect(migratedSource).not.toMatch(/\b(window\.)?confirm\s*\(/);
  });

  it("nao reintroduz useToast nem Toaster local no client", () => {
    const clientSource = fs
      .readdirSync(path.join(projectRoot, "client/src"), { recursive: true })
      .filter((entry) => typeof entry === "string")
      .filter((entry) => /\.(ts|tsx)$/.test(entry))
      .map((entry) => readProjectFile(path.join("client/src", entry)))
      .join("\n");

    expect(clientSource).not.toContain("@/components/ui/use-toast");
    expect(clientSource).not.toContain("components/ui/use-toast");

    const toasterMatches = clientSource.match(/<Toaster\b/g) || [];
    expect(toasterMatches).toHaveLength(1);
  });
});
