// client/src/pages/adminNutri/logic/useAdminNutri.ts
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

export interface NutriData {
  id: string;
  userId: string;
  crn: string;
  specialty: string | null;
  isActive: boolean | null;
  isVerified: boolean | null;
  discountPercentage: number | null;
  referralCode: string | null;
  name: string;
  email: string | null;
}

interface NutriUpdateInput {
  id: string;
  discountPercentage?: number;
  isVerified?: boolean;
  isActive?: boolean;
  crn?: string;
  specialty?: string;
}

export function useAdminNutri() {
  const utils = trpc.useUtils();

  const query = trpc.admin.nutris.listAll.useQuery();
  const nutris = (query.data as NutriData[]) || [];

  const updateMutation = trpc.admin.nutris.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      utils.admin.nutris.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.nutris.delete.useMutation({
    onSuccess: () => {
      toast.success("Parceiro removido!");
      utils.admin.nutris.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpdate = (id: string, data: Partial<NutriData>) => {
    // ✅ Converte null → undefined para satisfazer o Zod no backend
    const cleanData: NutriUpdateInput = {
      id,
      ...(data.discountPercentage != null && { discountPercentage: data.discountPercentage }),
      ...(data.isVerified != null && { isVerified: data.isVerified }),
      ...(data.isActive != null && { isActive: data.isActive }),
      ...(data.crn != null && { crn: data.crn }),
      ...(data.specialty != null && { specialty: data.specialty }),
    };
    updateMutation.mutate(cleanData);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover ${name}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const copyReferralLink = (referralCode: string) => {
    navigator.clipboard.writeText(`https://gourmetsaudavel.com/convite/${referralCode}`);
    toast.success("Link copiado!");
  };

  return {
    nutris,
    isLoading: query.isLoading,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleUpdate,
    handleDelete,
    copyReferralLink,
  };
}