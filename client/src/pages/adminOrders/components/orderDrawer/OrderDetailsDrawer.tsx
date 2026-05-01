import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, Trash2, FlipHorizontal, Type, Box, 
  Image as ImageIcon, Printer, Save 
} from "lucide-react";
import { LabelElement } from "../../components/orderDrawer/print/design/LabelCanvas"; 
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

interface LabelPropertiesProps {
  selectedElement: LabelElement | undefined;
  setSelectedId: (id: string | null) => void;
  setElements: React.Dispatch<React.SetStateAction<LabelElement[]>>;
  // ✅ Adicionado para disparar a prévia/impressão
  onOpenPrintCenter?: () => void;
}

export function LabelProperties({ 
  selectedElement, 
  setSelectedId, 
  setElements,
  onOpenPrintCenter 
}: LabelPropertiesProps) {
  
  if (!selectedElement) return (
    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
        Selecione um item no canvas para editar
      </p>
    </div>
  );

  const updateEl = (data: Partial<LabelElement>) => {
    setElements((prev) => 
      prev.map(el => el.id === selectedElement.id ? { ...el, ...data } : el)
    );
  };

  const deleteEl = () => {
    if (window.confirm("Deseja excluir este elemento?")) {
      setElements((prev) => prev.filter(el => el.id !== selectedElement.id));
      setSelectedId(null);
      toast.error("Elemento removido");
    }
  };

  const getTypeIcon = () => {
    switch (selectedElement.type) {
      case 'text': return <Type size={12} />;
      case 'box': return <Box size={12} />;
      case 'image': return <ImageIcon size={12} />;
      default: return null;
    }
  };

  return (
    <div className="p-5 bg-white rounded-[2rem] space-y-5 border border-slate-100 animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-slate-200/50 w-full max-w-[300px] text-left">
      
      {/* HEADER DINÂMICO */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 rounded-xl text-emerald-400 shadow-lg shadow-slate-200">
            {getTypeIcon()}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase italic text-slate-400 leading-none tracking-tighter">
              Propriedades
            </span>
            <span className="text-xs font-black text-slate-900 uppercase">
              {selectedElement.type}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-400 hover:bg-red-50 rounded-xl" 
            onClick={deleteEl}
          >
            <Trash2 size={14}/>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-xl" 
            onClick={() => setSelectedId(null)}
          >
            <X size={14}/>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* COORDENADAS E DIMENSÕES */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Eixo X</label>
            <Input 
              type="number" 
              className="h-9 bg-slate-50 border-none font-bold text-xs rounded-xl focus-visible:ring-emerald-500" 
              value={Math.round(selectedElement.x)} 
              onChange={(e) => updateEl({ x: Number(e.target.value) })} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Eixo Y</label>
            <Input 
              type="number" 
              className="h-9 bg-slate-50 border-none font-bold text-xs rounded-xl focus-visible:ring-emerald-500" 
              value={Math.round(selectedElement.y)} 
              onChange={(e) => updateEl({ y: Number(e.target.value) })} 
            />
          </div>
        </div>

        {/* ESTILO E ESCALA */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
               {selectedElement.type === 'text' ? 'Tamanho' : 'Borda/Escala'}
            </label>
            <Input 
              type="number" 
              className="h-9 bg-slate-50 border-none font-bold text-xs rounded-xl" 
              value={selectedElement.fontSize || 10} 
              onChange={(e) => updateEl({ fontSize: Number(e.target.value) })} 
            />
          </div>
          
          <div className="flex items-end">
            {selectedElement.type !== 'image' && (
              <Button 
                variant="outline"
                className={cn(
                  "h-9 w-full text-[9px] font-black uppercase border-none rounded-xl gap-2 transition-all active:scale-95 shadow-sm",
                  selectedElement.backgroundColor === 'black' 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )} 
                onClick={() => updateEl({ 
                   color: selectedElement.color === 'white' ? 'black' : 'white', 
                   backgroundColor: selectedElement.backgroundColor === 'black' ? 'transparent' : 'black' 
                })}
              >
                <FlipHorizontal size={12} /> Inverter
              </Button>
            )}
          </div>
        </div>

        {/* CONTEÚDO DINÂMICO */}
        {selectedElement.type === 'text' && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Conteúdo do Texto</label>
            <Input 
              className="h-9 bg-slate-50 border-none font-bold text-xs rounded-xl" 
              value={selectedElement.content} 
              onChange={(e) => updateEl({ content: e.target.value })} 
            />
          </div>
        )}

        {/* DIMENSÕES DE BOX/IMAGE */}
        {(selectedElement.type === 'image' || selectedElement.type === 'box') && (
           <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Largura (px)</label>
               <Input 
                 type="number" 
                 className="h-9 bg-slate-50 border-none font-bold text-xs rounded-xl" 
                 value={selectedElement.width || 0} 
                 onChange={(e) => updateEl({ width: Number(e.target.value) })} 
               />
             </div>
             <div className="space-y-1.5">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Altura (px)</label>
               <Input 
                 type="number" 
                 className="h-9 bg-slate-50 border-none font-bold text-xs rounded-xl" 
                 value={selectedElement.height || 0} 
                 onChange={(e) => updateEl({ height: Number(e.target.value) })} 
               />
             </div>
           </div>
        )}

        {/* ✅ FOOTER DE AÇÕES - Integração com PrintCenter */}
        <div className="pt-4 border-t border-slate-50 flex gap-2">
          <Button 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 gap-2 font-black uppercase text-[10px] tracking-tighter transition-all active:scale-95 shadow-lg shadow-emerald-100"
            onClick={() => toast.success("Design salvo com sucesso!")}
          >
            <Save size={14} /> Salvar
          </Button>
          
          <Button 
            variant="outline"
            className="flex-1 bg-slate-900 hover:bg-black text-white border-none rounded-xl h-10 gap-2 font-black uppercase text-[10px] tracking-tighter transition-all active:scale-95 shadow-lg shadow-slate-200"
            onClick={onOpenPrintCenter}
          >
            <Printer size={14} /> Testar
          </Button>
        </div>
      </div>
    </div>
  );
}