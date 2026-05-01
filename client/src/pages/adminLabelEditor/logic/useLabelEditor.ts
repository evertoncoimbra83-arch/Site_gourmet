// client/src/pages/adminLabelEditor/logic/useLabelEditor.ts
import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import type { LabelElement, LabelConfig } from "./label-compiler";

export interface LabelTemplate {
  id: number;
  name: string;
  width: number | null;
  height: number | null;
  elements: string;
  isDefault: boolean | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export function useLabelEditor(initialId?: number) {
  const [elements, setElements]   = useState<LabelElement[]>([]);
  const [name, setName]           = useState("Novo Layout");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    width: 100,   // mm
    height: 60,   // mm
    dpi: 203,     // ✅ DPI da Zebra — troque para 300 se sua impressora for 300dpi
  });

  const utils = trpc.useUtils();

  const { data: template, isLoading } = trpc.admin.labels.getTemplates.useQuery(undefined, {
    enabled: !!initialId,
    select: (list: LabelTemplate[]) => list.find((t) => t.id === initialId),
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      if (template.width)
        setLabelConfig(prev => ({ ...prev, width: template.width as number }));
      if (template.height)
        setLabelConfig(prev => ({ ...prev, height: template.height as number }));
      try {
        setElements(JSON.parse(template.elements) as LabelElement[]);
      } catch (e) {
        console.error("Erro ao fazer parse dos elementos:", e);
      }
    }
  }, [template]);

  const upsertMutation = trpc.admin.labels.upsertTemplate.useMutation({
    onSuccess: () => {
      toast.success("Layout salvo!");
      utils.admin.labels.getTemplates.invalidate();
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message),
  });

  const addElement = (type: LabelElement["type"]) => {
    const newEl: LabelElement = {
      id:         crypto.randomUUID(),
      type,
      x:          20,
      y:          20,
      fontSize:   16,
      field:      type === "text" ? "dishName" : "orderId",
      staticText: "",
      width:      type === "nutrition_table" ? 200 : type === "barcode" ? 160 : 130,
      height:     type === "nutrition_table" ? 110 : type === "barcode" ?  50 :  28,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = () => {
    upsertMutation.mutate({
      id:        initialId,
      name,
      width:     labelConfig.width,
      height:    labelConfig.height,
      elements:  JSON.stringify(elements),
      isDefault: false,
    });
  };

  return {
    state: {
      elements,
      name,
      selectedId,
      isLoading,
      template,
      labelConfig,
    },
    actions: {
      setName,
      setSelectedId,
      setElements,
      setLabelConfig,
      addElement,
      updateElement,
      removeElement,
      handleSave,
    },
    mutations: {
      isSaving: upsertMutation.isPending,
    },
  };
}