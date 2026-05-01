import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";
import type { ReactElement, ReactNode } from "react";

export const APP_TOAST_DURATION = {
  success: 2500,
  info: 4000,
  warning: 5000,
  error: 7000,
} as const;

type ToastMessage = ReactNode;
type PromiseInput<T> = Promise<T> | (() => Promise<T>);

type PromiseToastOptions<T> = ExternalToast & {
  loading?: ToastMessage;
  success?: ToastMessage | ((data: T) => ToastMessage);
  error?: ToastMessage | ((error: unknown) => ToastMessage);
};

const TECHNICAL_ERROR_PATTERNS = [
  /\btrpc\b/i,
  /\bzod\b/i,
  /\bprisma\b/i,
  /\bdrizzle\b/i,
  /\bstack\b/i,
  /\bundefined\b/i,
  /\bnull\b/i,
  /\btimeout\b/i,
  /\bnetwork\b/i,
  /\binternal_server_error\b/i,
  /\bsyntaxerror\b/i,
  /\btypeerror\b/i,
  /\berror:\s/i,
];

function isPlainText(value: ToastMessage): value is string {
  return typeof value === "string";
}

function normalizeTitle(message: ToastMessage, fallback: string): ToastMessage {
  if (!isPlainText(message)) return message;
  const clean = message.trim();
  return clean || fallback;
}

function isTechnicalMessage(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(value));
}

function normalizeErrorMessage(message: ToastMessage): ToastMessage {
  if (!isPlainText(message)) return message;
  const clean = message.trim();
  if (!clean || isTechnicalMessage(clean)) {
    return "Não foi possível concluir a ação.";
  }
  if (/^(erro|falha)\s*:/i.test(clean)) {
    return "Não foi possível concluir a ação.";
  }
  return clean
    .replace(/^erro\s*:\s*/i, "")
    .replace(/^falha\s*:\s*/i, "")
    .trim();
}

function sanitizeOptions(options: ExternalToast | undefined, duration: number): ExternalToast {
  const description = isTechnicalMessage(options?.description)
    ? "Tente novamente. Se o problema continuar, acione o suporte."
    : options?.description;

  return {
    ...options,
    description,
    duration: options?.duration ?? duration,
  };
}

function notify(message: ToastMessage, options?: ExternalToast): string | number {
  return sonnerToast(normalizeTitle(message, "Informação"), sanitizeOptions(options, APP_TOAST_DURATION.info));
}

type AppToastApi = typeof notify & {
  success: (message: ToastMessage, options?: ExternalToast) => string | number;
  error: (message: ToastMessage, options?: ExternalToast) => string | number;
  warning: (message: ToastMessage, options?: ExternalToast) => string | number;
  info: (message: ToastMessage, options?: ExternalToast) => string | number;
  loading: (message: ToastMessage, options?: ExternalToast) => string | number;
  promise: <T>(promise: PromiseInput<T>, options?: PromiseToastOptions<T>) => unknown;
  dismiss: (id?: string | number) => string | number;
  custom: (jsx: (id: number | string) => ReactElement, options?: ExternalToast) => string | number;
  message: typeof notify;
  getHistory: () => unknown[];
  getToasts: () => unknown[];
};

export const appToast: AppToastApi = Object.assign(notify, {
  success(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.success(
      normalizeTitle(message, "Ação concluída."),
      sanitizeOptions(options, APP_TOAST_DURATION.success),
    );
  },

  error(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.error(
      normalizeErrorMessage(message),
      sanitizeOptions(options, APP_TOAST_DURATION.error),
    );
  },

  warning(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.warning(
      normalizeTitle(message, "Atenção necessária."),
      sanitizeOptions(options, APP_TOAST_DURATION.warning),
    );
  },

  info(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.info(
      normalizeTitle(message, "Informação."),
      sanitizeOptions(options, APP_TOAST_DURATION.info),
    );
  },

  loading(message: ToastMessage, options?: ExternalToast) {
    return sonnerToast.loading(normalizeTitle(message, "Processando..."), options);
  },

  promise<T>(promise: PromiseInput<T>, options?: PromiseToastOptions<T>) {
    return sonnerToast.promise(promise, {
      ...options,
      loading: options?.loading ?? "Processando...",
      success: options?.success ?? "Ação concluída.",
      error: options?.error ?? "Não foi possível concluir a ação.",
      duration: options?.duration ?? APP_TOAST_DURATION.info,
    });
  },

  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
  message: notify,
  getHistory: sonnerToast.getHistory,
  getToasts: sonnerToast.getToasts,
});

export type AppToast = typeof appToast;
