export type StrongConfirmationPayload = {
  confirmationToken: "CONFIRMAR";
  confirmationReason: string;
};

export function requestStrongConfirmation(
  title: string,
  reasonPrompt = "Informe uma justificativa operacional:",
): StrongConfirmationPayload | null {
  const token = window.prompt(`${title}\n\nDigite CONFIRMAR para continuar.`);
  if (token !== "CONFIRMAR") return null;

  const reason = window.prompt(reasonPrompt)?.trim();
  if (!reason || reason.length < 8) return null;

  return {
    confirmationToken: "CONFIRMAR",
    confirmationReason: reason,
  };
}
