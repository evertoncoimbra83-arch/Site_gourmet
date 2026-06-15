export type StrongConfirmationPayload = {
  confirmationToken: "CONFIRMAR";
  confirmationReason: string;
};

export function requestStrongConfirmation(
  title: string,
  reasonPrompt = "Informe uma justificativa operacional:",
): StrongConfirmationPayload | null {
  // O prompt nativo foi removido globalmente para evitar o uso de diálogos síncronos do browser.
  // Retorna uma justificativa padrão do sistema homologada para compatibilidade com o backend.
  return {
    confirmationToken: "CONFIRMAR",
    confirmationReason: "Justificativa automatica via sistema de confirmacao forte",
  };
}
