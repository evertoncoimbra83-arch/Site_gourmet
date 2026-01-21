import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Printer, Type, Save, Trash2, Plus, 
  Package, Utensils, ImageIcon, X, Calendar, User, Hash, Clock, 
  Activity, ScrollText, ListPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

// Componentes modulares
import { useLabelLogic } from "@/hooks/useLabelLogic"; 
import { LabelCanvas } from "@/components/LabelCanvas";
import { LabelElement } from "./OrderPrintCenter"; 

interface LabelDesignerProps {
  order: any;
  onSaveTemplate: (elements: LabelElement[]) => void;
  initialLayout?: LabelElement[]; 
  onCancel?: () => void;
}

export function LabelDesigner({ order, onSaveTemplate, initialLayout, onCancel }: LabelDesignerProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState(0);
  const [validityDays, setValidityDays] = useState(90);
  
  const [elements, setElements] = useState<LabelElement[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { flatLabels, parseContent } = useLabelLogic(order, selectedLabelIndex, validityDays);

  // Sincronização com o Banco de Dados
  useEffect(() => {
    const loadLayout = () => {
      if (initialLayout && Array.isArray(initialLayout) && initialLayout.length > 0) {
        const roundedLayout = initialLayout.map(el => ({
          ...el,
          x: Math.round(el.x),
          y: Math.round(el.y),
          width: Math.round(el.width),
          height: Math.round(el.height)
        }));
        setElements(roundedLayout);
      } else {
        // Layout Padrão Completo
        setElements([
          { id: '1', type: 'text', content: 'CLIENTE:', x: 20, y: 20, width: 100, height: 20, fontSize: 10, fontWeight: '700', zIndex: 10 },
          { id: '2', type: 'variable', content: '{cliente_nome}', x: 20, y: 40, width: 330, height: 40, fontSize: 22, fontWeight: '900', zIndex: 10 },
          { id: '3', type: 'box', content: '', x: 0, y: 100, width: 378, height: 50, fontSize: 0, fontWeight: 'normal', backgroundColor: 'black', zIndex: 1 },
          { id: '4', type: 'variable', content: '{prato_nome}', x: 10, y: 110, width: 358, height: 30, fontSize: 18, fontWeight: '700', color: 'white', textAlign: 'center', zIndex: 10 },
          { id: '5', type: 'variable', content: '{acompanhamentos}', x: 20, y: 160, width: 340, height: 80, fontSize: 11, fontWeight: '600', zIndex: 10 },
          { id: '6', type: 'variable', content: '{ingredientes}', x: 20, y: 450, width: 340, height: 60, fontSize: 8, fontWeight: '400', zIndex: 10 },
          { id: '7', type: 'variable', content: 'VAL: {data_validade}', x: 250, y: 530, width: 100, height: 20, fontSize: 10, fontWeight: '900', zIndex: 10 },
        ]);
      }
    };
    loadLayout();
  }, [initialLayout]);

  const handleSave = () => {
    const preciseElements = elements.map(el => ({
      ...el,
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height)
    }));
    onSaveTemplate?.(preciseElements);
  };

  const addElement = (type: 'text' | 'variable', initialContent?: string, fontSize = 12, height = 30) => {
    const newEl: LabelElement = {
      id: `el-${Date.now()}`,
      type,
      content: initialContent || (type === 'variable' ? '{novo_campo}' : 'TEXTO FIXO'),
      x: 50, y: 200, width: 250, height: height,
      fontSize: fontSize, fontWeight: '700', zIndex: 10
    };
    setElements([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setElements([...elements, {
          id: `img-${Date.now()}`, type: 'image', content: event.target?.result as string,
          x: 140, y: 10, width: 80, height: 80, fontSize: 0, fontWeight: 'normal', zIndex: 5
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Etiqueta_${order?.id || 'Zebra'}`,
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[85vh] bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xl">
      
      {/* SIDEBAR DO DESIGNER */}
      <div className="w-full lg:w-80 bg-white p-5 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar h-[600px] lg:h-auto">
        <header className="border-b pb-4 flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase text-slate-900 text-sm italic tracking-tighter">Editor Studio</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visualizando:</p>
          </div>
          {onCancel && (
             <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-slate-400 hover:text-red-500">
                <X size={16} />
             </Button>
          )}
        </header>

        {/* INPUT DE VALIDADE */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
           <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
             <Clock size={12}/> Validade (Dias):
           </span>
           <Input 
             type="number" 
             value={validityDays} 
             onChange={(e) => setValidityDays(Number(e.target.value))} 
             className="w-16 h-8 text-center font-bold text-xs bg-white"
           />
        </div>

        {/* LISTA DE PRATOS */}
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {flatLabels.map((label: any, idx: number) => (
            <button
              key={label.id}
              onClick={() => setSelectedLabelIndex(idx)}
              className={cn(
                "w-full text-left p-3 rounded-2xl text-[10px] font-black uppercase transition-all border-2",
                selectedLabelIndex === idx 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              )}
            >
              <div className="flex items-center gap-2">
                {label.slot ? <Package size={12} /> : <Utensils size={12} />}
                <span className="truncate">{label.quantity}X {label.displayName}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          {/* ✅ GRUPO: DADOS DO PEDIDO */}
          <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Dados do Pedido:</span>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => addElement('variable', '{pedido_id}', 14)} className="h-9 rounded-xl font-bold text-[9px] uppercase border-slate-200">
              <Hash size={12} className="mr-1 text-slate-400"/> # Pedido
            </Button>
            <Button variant="outline" onClick={() => addElement('variable', '{cliente_nome}', 16)} className="h-9 rounded-xl font-bold text-[9px] uppercase border-slate-200">
              <User size={12} className="mr-1 text-slate-400"/> Cliente
            </Button>
            <Button variant="outline" onClick={() => addElement('variable', 'VAL: {data_validade}', 10)} className="h-9 rounded-xl font-bold text-[9px] uppercase border-slate-200">
              <Calendar size={12} className="mr-1 text-slate-400"/> Validade
            </Button>
            <Button variant="outline" onClick={() => addElement('variable', 'FAB: {data_impressao}', 10)} className="h-9 rounded-xl font-bold text-[9px] uppercase border-slate-200">
              <Printer size={12} className="mr-1 text-slate-400"/> Data Fab.
            </Button>
          </div>

          {/* ✅ GRUPO: DADOS DO PRATO (ACOMPANHAMENTOS E NUTRIÇÃO) */}
          <span className="text-[9px] font-black uppercase text-slate-400 block mb-1 mt-2 border-t pt-2 border-slate-100">Conteúdo da Marmita:</span>
          <div className="grid grid-cols-2 gap-2">
             {/* Prato */}
            <Button variant="secondary" onClick={() => addElement('variable', '{prato_nome}', 18)} className="h-9 rounded-xl font-bold text-[9px] uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 col-span-2">
               <Utensils size={12} className="mr-1"/> Nome do Prato
            </Button>
            
            {/* Acompanhamentos */}
            <Button variant="secondary" onClick={() => addElement('variable', '{acompanhamentos}', 11, 80)} className="h-9 rounded-xl font-bold text-[9px] uppercase bg-white border border-slate-200">
               <ListPlus size={12} className="mr-1 text-slate-500"/> Acomp.
            </Button>
            
            {/* Ingredientes */}
            <Button variant="secondary" onClick={() => addElement('variable', '{ingredientes}', 8, 60)} className="h-9 rounded-xl font-bold text-[9px] uppercase bg-white border border-slate-200">
               <ScrollText size={12} className="mr-1 text-slate-500"/> Ingred.
            </Button>
            
            {/* Nutrição */}
            <Button variant="secondary" onClick={() => addElement('variable', '{tabela_nutricional}', 9)} className="h-9 rounded-xl font-bold text-[9px] uppercase bg-white border border-slate-200 col-span-2">
               <Activity size={12} className="mr-1 text-slate-500"/> Tabela Nutricional
            </Button>
          </div>
          
          <div className="pt-2 mt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => addElement('text')} className="w-full h-9 rounded-xl font-bold text-[9px] uppercase border-slate-200 mb-2">
              <Type size={12} className="mr-1"/> Texto Livre Manual
            </Button>
            <Button variant="outline" className="w-full h-9 rounded-xl font-bold text-[9px] uppercase border-slate-200" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={12} className="mr-1"/> Adicionar Logo / Imagem
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          {/* EDITOR DE PROPRIEDADES (Fica no rodapé da sidebar quando selecionado) */}
          {selectedElementId && (
            <div className="p-4 bg-slate-900 rounded-3xl space-y-3 text-white shadow-2xl animate-in zoom-in-95 mt-4">
              <header className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-400">Editar Item</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => { setElements(prev => prev.filter(e => e.id !== selectedElementId)); setSelectedElementId(null); }}>
                  <Trash2 size={14}/>
                </Button>
              </header>
              <Input 
                className="h-8 text-xs bg-white/10 border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-emerald-500" 
                value={elements.find(el => el.id === selectedElementId)?.content || ''} 
                onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? {...el, content: e.target.value} : el))} 
              />
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  className="h-8 w-20 bg-white/10 border-none text-white text-xs" 
                  value={elements.find(el => el.id === selectedElementId)?.fontSize || 10} 
                  onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? {...el, fontSize: Number(e.target.value)} : el))} 
                />
                <Button size="sm" className="flex-1 h-8 text-[9px] font-black uppercase bg-white/10 hover:bg-white/20" onClick={() => setElements(prev => prev.map(el => el.id === selectedElementId ? {...el, color: el.color === 'white' ? 'black' : 'white'} : el))}>Inverter Cor</Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t space-y-2">
           <Button onClick={() => handlePrint()} className="w-full bg-slate-900 text-white h-12 rounded-xl font-black uppercase text-[10px] hover:bg-black shadow-lg">
              <Printer size={16} className="mr-2"/> Imprimir Zebra
           </Button>
           <Button onClick={handleSave} variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-[10px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 transition-all">
              <Save size={16} className="mr-2"/> Salvar Template
           </Button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 bg-slate-200/50 rounded-[2rem] flex items-center justify-center p-4 lg:p-10 border-4 border-dashed border-slate-300 shadow-inner overflow-hidden">
        <LabelCanvas 
          elements={elements} 
          setElements={setElements} 
          isDesignMode={true} 
          selectedId={selectedElementId} 
          setSelectedId={setSelectedElementId} 
          parseContent={parseContent} 
          labelRef={printRef} 
        />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}