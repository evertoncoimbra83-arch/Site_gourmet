import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TemplateSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
  initialName?: string;
}

export function TemplateSaveDialog({
  isOpen,
  onClose,
  onSave,
  initialName,
}: TemplateSaveDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Sincroniza o nome inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setDescription(""); // Limpa a descrição para um novo salvamento
    }
  }, [isOpen, initialName]);

  const handleConfirm = () => {
    if (name.trim().length < 3) {
      return; // O botão já deve estar desabilitado ou validado, mas por segurança...
    }
    onSave({ name, description });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="z-110 rounded-4xl p-8 max-w-[90vw] md:max-w-md border-none shadow-2xl outline-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
            Salvar Modelo <span className="text-emerald-500">.</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Defina o nome e uma descrição breve para salvar na sua biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              Nome do Pacote
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hipertrofia Iniciante"
              className="h-12 rounded-2xl border-slate-100 font-bold focus-visible:ring-emerald-500 shadow-none bg-slate-50/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              Descrição Breve (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 rounded-2xl border border-slate-100 p-4 text-sm font-medium focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none shadow-none bg-slate-50/50 placeholder:text-slate-300"
              placeholder="Ex: Protocolo focado em ganho de massa magra com 4 refeições..."
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col md:flex-row gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold uppercase text-[10px] order-2 md:order-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={name.trim().length < 3}
            className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-8 h-12 font-black uppercase text-[10px] tracking-widest text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 order-1 md:order-2"
          >
            Confirmar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}