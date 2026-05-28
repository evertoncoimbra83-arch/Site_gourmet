type TrpcLikeError = {
  message?: string;
  data?: {
    code?: string;
  };
};

export function getAdminMutationErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel concluir a acao administrativa.",
) {
  const trpcError = error as TrpcLikeError | undefined;
  const message = trpcError?.message?.trim();
  const code = trpcError?.data?.code;

  if (code === "FORBIDDEN") {
    return message || "Voce nao tem permissao para executar esta acao.";
  }

  if (code === "BAD_REQUEST" && message) {
    return message;
  }

  const lowerMessage = message?.toLowerCase() || "";
  if (
    lowerMessage.includes("confirmacao forte") ||
    lowerMessage.includes("confirme") ||
    message?.includes("CONFIRMAR")
  ) {
    return message;
  }

  return message || fallback;
}
