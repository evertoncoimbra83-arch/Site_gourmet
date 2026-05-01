import { useContext, useEffect, useMemo, useRef } from "react";
import posthog from "posthog-js";
import OneSignal from "react-onesignal";
import { AuthContext } from "@/_core/context";
import { useAnalytics } from "@/_core/hooks/useAnalytics";
import { trpc } from "../trpc";
import { rotateGuestId } from "@/lib/guest";

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  customerDocument?: string | null;
  cpf?: string | null;
  document?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  mobile?: string | null;
  needsPasswordReset?: boolean;
  availablePoints?: number;
  referral?: string | null;
}

type OneSignalInterface = {
  login?: (id: string) => Promise<void>;
  logout?: () => Promise<void> | void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null | undefined {
  return typeof value === "string" || value === null ? value : undefined;
}

function normalizeAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.email !== "string") return null;

  return {
    id: value.id,
    email: value.email,
    name: nullableString(value.name),
    role: typeof value.role === "string" ? value.role : undefined,
    customerDocument: nullableString(value.customerDocument),
    cpf: nullableString(value.cpf),
    document: nullableString(value.document),
    phone: nullableString(value.phone),
    whatsapp: nullableString(value.whatsapp),
    mobile: nullableString(value.mobile),
    needsPasswordReset:
      typeof value.needsPasswordReset === "boolean" ? value.needsPasswordReset : undefined,
    availablePoints:
      typeof value.availablePoints === "number" ? value.availablePoints : undefined,
    referral: nullableString(value.referral),
  };
}

export function useAuth() {
  const utils = trpc.useUtils();
  const context = useContext(AuthContext);
  const { setUserId, clearUserId } = useAnalytics();

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  const user = useMemo(() => normalizeAuthUser(context.user), [context.user]);
  const { isLoading, isAuthenticated, openAuthModal, closeAuthModal, isAuthModalOpen } = context;
  const lastOneSignalLoginRef = useRef<string | null>(null);

  useEffect(() => {
    const identifyId = user?.id ? String(user.id) : null;

    if (identifyId && window.location.pathname === "/login") {
      if (user?.needsPasswordReset) {
        window.location.href = "/primeiro-acesso";
        return;
      }

      const isAdminUser = user?.role?.toLowerCase() === "admin";
      window.location.href = isAdminUser ? "/admin/dashboard" : "/";
      return;
    }

    if (!identifyId) {
      clearUserId();
      return;
    }

    setUserId(identifyId);

    try {
      posthog.identify(identifyId, {
        email: user?.email,
        name: user?.name,
        role: user?.role,
        source: "webapp",
      });
    } catch {
      // Rastreamento auxiliar não deve bloquear autenticação.
    }

    if (lastOneSignalLoginRef.current === identifyId) return;

    const oneSignalClient: OneSignalInterface = OneSignal;
    if (
      typeof oneSignalClient.login === "function" &&
      window.location.protocol === "https:"
    ) {
      oneSignalClient
        .login(identifyId)
        .then(() => {
          lastOneSignalLoginRef.current = identifyId;
        })
        .catch(() => {
          // Falha silenciosa do push não deve interferir na sessão.
        });
    }
  }, [user, setUserId, clearUserId]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearUserId();

      try {
        posthog.reset();
      } catch {
        // ignore
      }

      try {
        const oneSignalClient: OneSignalInterface = OneSignal;
        if (typeof oneSignalClient.logout === "function") {
          oneSignalClient.logout();
        }
      } catch {
        // ignore
      }

      lastOneSignalLoginRef.current = null;
      rotateGuestId();
      utils.invalidate();
      utils.auth.me.setData(undefined, null);
      utils.store.cart.getSummary.setData(undefined, null);
      window.location.replace("/");
    },
    onError: (err) => {
      if (err.shape?.data?.code === "UNAUTHORIZED") {
        clearUserId();
        utils.auth.me.setData(undefined, null);
        window.location.replace("/");
      }
    },
  });

  return {
    user,
    loading: isLoading,
    isAuthenticated,
    isAdmin: user?.role?.toLowerCase() === "admin",
    needsPasswordReset: user?.needsPasswordReset ?? false,
    logout: () => {
      if (!logoutMutation.isPending) {
        logoutMutation.mutate();
      }
    },
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen,
  };
}
