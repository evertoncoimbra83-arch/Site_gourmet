export type ManualSaleStartupState = "initializing" | "loading" | "error" | "ready";

interface ManualSaleStartupInput {
  draftId: string | null;
  wizardLoading: boolean;
  initPending: boolean;
  initError: boolean;
  wizardError: boolean;
}

export function getManualSaleStartupState({
  draftId,
  wizardLoading,
  initPending,
  initError,
  wizardError,
}: ManualSaleStartupInput): ManualSaleStartupState {
  if (initError || wizardError) return "error";
  if (!draftId || initPending) return "initializing";
  if (wizardLoading) return "loading";
  return "ready";
}
