type TrpcLikeError = {
  message?: string;
  data?: {
    code?: string;
    requestId?: string;
  };
};

function appendRequestId(message: string, requestId?: string) {
  if (!requestId) return message;
  return `${message} Código do erro: ${requestId}`;
}

export function getAdminMutationErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel concluir a acao administrativa.",
) {
  const trpcError = error as TrpcLikeError | undefined;
  const message = trpcError?.message?.trim();
  const code = trpcError?.data?.code;
  const requestId = trpcError?.data?.requestId;

  if (code === "FORBIDDEN") {
    return appendRequestId(
      message || "Voce nao tem permissao para executar esta acao.",
      requestId,
    );
  }

  if (code === "BAD_REQUEST" && message) {
    return appendRequestId(message, requestId);
  }

  const lowerMessage = message?.toLowerCase() || "";
  if (
    lowerMessage.includes("confirmacao forte") ||
    lowerMessage.includes("confirme") ||
    message?.includes("CONFIRMAR")
  ) {
    return appendRequestId(message || fallback, requestId);
  }

  return appendRequestId(message || fallback, requestId);
}
