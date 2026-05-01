// client/src/pages/admin/packages/logic/usePackageDraft.ts
import { useEffect } from "react";
import { PackageFormData } from "../../components/PackageDrawer";

// --- INTERFACES ---
interface SlotGroup { id: string; customLabel?: string | null; }
interface Slot { name: string; dishIds: string[]; groups: SlotGroup[]; sizeId?: string | number; }

interface DraftData {
  formData: PackageFormData;
  slots: Slot[];
}

export function usePackageDraft(
  isOpen: boolean,
  isEditing: boolean, 
  formData: PackageFormData,
  slots: Slot[],
  reset: (data: PackageFormData) => void,
  loadSlots: (slots: Slot[]) => void
) {
  const DRAFT_KEY = "@gourmet:package_draft";

  // 1. Efeito para SALVAR AUTOMATICAMENTE
  // Só salva se o Drawer estiver aberto e for um NOVO pacote (isEditing === false)
  useEffect(() => {
    if (isOpen && !isEditing) {
      const timeout = setTimeout(() => {
        const draft: DraftData = { formData, slots };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }, 1500); // Debounce um pouco maior para não sobrecarregar o IO
      return () => clearTimeout(timeout);
    }
  }, [formData, slots, isOpen, isEditing]);

  // 2. Função para RECUPERAR o rascunho
  const restoreDraft = (): boolean => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const { formData: savedForm, slots: savedSlots }: DraftData = JSON.parse(saved);
        
        // Aplica os dados recuperados ao formulário e à lógica de slots
        reset(savedForm);
        loadSlots(savedSlots);
        return true;
      }
    } catch (error) {
      console.error("Erro ao recuperar rascunho:", error);
    }
    return false;
  };

  // 3. Função para LIMPAR (Deve ser chamada no onSubmit com sucesso)
  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  // 4. Verifica se existe rascunho para mostrar o alerta na UI
  const hasDraft = !!localStorage.getItem(DRAFT_KEY);

  return { restoreDraft, clearDraft, hasDraft };
}