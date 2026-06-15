import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary as ErrorBoundaryUi } from "../client/src/components/ui/ErrorBoundary.js";
import { ErrorBoundary as ErrorBoundaryRoot } from "../client/src/components/ErrorBoundary.js";

// Helper simulating route matching from the hook
function isCheckoutRouteHelper(pathname: string): boolean {
  return [
    "/carrinho",
    "/checkout",
    "/finalizar-pedido",
    "/success",
    "/sucesso",
    "/pagamento"
  ].some((path) => pathname.toLowerCase().startsWith(path));
}

describe("Auto Refresh Version Checker Strategy", () => {
  describe("Checkout Route Protection Check", () => {
    it("identifies checkout/cart/payment paths correctly", () => {
      expect(isCheckoutRouteHelper("/carrinho")).toBe(true);
      expect(isCheckoutRouteHelper("/checkout")).toBe(true);
      expect(isCheckoutRouteHelper("/finalizar-pedido")).toBe(true);
      expect(isCheckoutRouteHelper("/sucesso")).toBe(true);
      expect(isCheckoutRouteHelper("/success")).toBe(true);
      expect(isCheckoutRouteHelper("/pagamento")).toBe(true);
      expect(isCheckoutRouteHelper("/checkout/pagamento")).toBe(true);
    });

    it("does not flag regular storefront or admin paths as checkout routes", () => {
      expect(isCheckoutRouteHelper("/")).toBe(false);
      expect(isCheckoutRouteHelper("/pratos")).toBe(false);
      expect(isCheckoutRouteHelper("/admin")).toBe(false);
      expect(isCheckoutRouteHelper("/admin/dashboard")).toBe(false);
    });
  });

  describe("ErrorBoundary ChunkLoadError Detection", () => {
    it("maps ChunkLoadError message to chunk error type in UI ErrorBoundary", () => {
      const chunkError1 = new Error("Failed to fetch dynamically imported module");
      const chunkError2 = new Error("Loading chunk 123 failed");
      const chunkError3 = { name: "ChunkLoadError", message: "Some chunk error" } as Error;

      const state1 = ErrorBoundaryUi.getDerivedStateFromError(chunkError1);
      const state2 = ErrorBoundaryUi.getDerivedStateFromError(chunkError2);
      const state3 = ErrorBoundaryUi.getDerivedStateFromError(chunkError3);

      expect(state1.errorType).toBe("chunk");
      expect(state2.errorType).toBe("chunk");
      expect(state3.errorType).toBe("chunk");
    });

    it("maps ChunkLoadError message to chunk error type in Root ErrorBoundary", () => {
      const chunkError = new Error("Failed to fetch dynamically imported module");
      const state = ErrorBoundaryRoot.getDerivedStateFromError(chunkError);
      expect(state.errorType).toBe("chunk");
    });

    it("maps network errors correctly to network type", () => {
      const netError = new Error("Failed to fetch");
      const state = ErrorBoundaryUi.getDerivedStateFromError(netError);
      expect(state.errorType).toBe("network");
    });

    it("maps unexpected rendering errors to render type", () => {
      const stdError = new Error("React render crash");
      const state = ErrorBoundaryUi.getDerivedStateFromError(stdError);
      expect(state.errorType).toBe("render");
    });

    it("avoids auto-refresh in development for ChunkLoadError", () => {
      const reloadMock = vi.fn();
      const mockWindow = {
        location: {
          reload: reloadMock,
          pathname: "/",
          href: "http://localhost/"
        }
      };

      const originalWindow = global.window;
      global.window = mockWindow as any;

      const originalProd = import.meta.env.PROD;
      // Force development environment
      import.meta.env.PROD = false as any;

      const errBoundary = new ErrorBoundaryUi({ children: null });
      errBoundary.componentDidCatch(new Error("Loading chunk 123 failed"), { componentStack: "" });

      expect(reloadMock).not.toHaveBeenCalled();

      // Restore
      global.window = originalWindow;
      import.meta.env.PROD = originalProd;
    });

    it("triggers auto-refresh in production for ChunkLoadError and respects loop protection", () => {
      const reloadMock = vi.fn();
      const store: Record<string, string> = {};
      const sessionStorageMock = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, val: string) => { store[key] = val; },
        removeItem: (key: string) => { delete store[key]; }
      };

      const mockWindow = {
        location: {
          reload: reloadMock,
          pathname: "/",
          href: "http://localhost/"
        }
      };

      const originalWindow = global.window;
      const originalSessionStorage = global.sessionStorage;
      global.window = mockWindow as any;
      global.sessionStorage = sessionStorageMock as any;

      const originalProd = import.meta.env.PROD;
      // Force production environment
      import.meta.env.PROD = true as any;

      const errBoundary = new ErrorBoundaryUi({ children: null });

      // First time - should reload
      errBoundary.componentDidCatch(new Error("Loading chunk 123 failed"), { componentStack: "" });
      expect(reloadMock).toHaveBeenCalledTimes(1);

      reloadMock.mockClear();

      // Second time immediately - should not reload because of loop protection
      errBoundary.componentDidCatch(new Error("Loading chunk 123 failed"), { componentStack: "" });
      expect(reloadMock).not.toHaveBeenCalled();

      // Restore
      global.window = originalWindow;
      global.sessionStorage = originalSessionStorage;
      import.meta.env.PROD = originalProd;
    });
  });
});
