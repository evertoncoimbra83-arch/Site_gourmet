import { trpc } from "@/_core/trpc";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function GroupOptionsList({ groupId }: { groupId: number }) {
  const utils = trpc.useUtils();

  // 🔍 Busca TODOS os acompanhamentos cadastrados no sistema
  const { data: allOptions, isLoading } = trpc.admin.accompaniments.options.listAll.useQuery();

  const upsertOption = trpc.admin.accompaniments.options.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
      toast.success("Vínculo atualizado!");
    }
  });

  const getSafeGroups = (config: any) => {
    if (!config) return [];
    if (Array.isArray(config)) return config;
    try { return typeof config === 'string' ? JSON.parse(config) : []; } catch { return []; }
  };

  const toggleLink = (opt: any) => {
    const configs = getSafeGroups(opt.groupsConfig);
    const isLinked = configs.some((g: any) => Number(g.group_id) === groupId);

    const newConfig = isLinked
      ? configs.filter((g: any) => Number(g.group_id) !== groupId)
      : [...configs, { group_id: groupId, price_modifier: "0.00" }];

    upsertOption.mutate({
      id: opt.id,
      name: opt.name,
      groupsConfig: newConfig,
      isActive: opt.isActive,
      accompanimentCategoryId: opt.accompanimentCategoryId
    });
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-300" /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {allOptions?.map((opt) => {
        const configs = getSafeGroups(opt.groupsConfig);
        const isLinked = configs.some((g: any) => Number(g.group_id) === groupId);

        return (
          <button
            key={opt.id}
            onClick={() => toggleLink(opt)}
            className={cn(
              "flex items-center justify-between p-4 rounded-[1.8rem] border-2 transition-all text-left",
              isLinked 
                ? "border-emerald-500 bg-white shadow-sm" 
                : "border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100 hover:border-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              {isLinked 
                ? <CheckCircle2 size={20} className="text-emerald-500 animate-in zoom-in" /> 
                : <Circle size={20} className="text-slate-200" />
              }
              <span className={cn(
                "text-[11px] font-black uppercase italic tracking-tight",
                isLinked ? "text-slate-800" : "text-slate-400"
              )}>
                {opt.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}