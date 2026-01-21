import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";

export function UploadZone({ state, actions, refs }: any) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    actions.setIsDragging(false);
    actions.processFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); actions.setIsDragging(true); }}
      onDragLeave={() => actions.setIsDragging(false)}
      onDrop={handleDrop}
      onClick={actions.triggerSelect}
      className={cn(
        "group relative border-4 border-dashed rounded-[3rem] p-16 transition-all cursor-pointer flex flex-col items-center justify-center gap-6",
        state.isDragging 
          ? "border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]" 
          : "border-slate-200 bg-white hover:border-[#2D5A3D]/30 hover:bg-slate-50"
      )}
    >
      <input
        type="file" multiple accept="image/*" className="hidden"
        ref={refs.fileInputRef}
        onChange={(e) => actions.processFiles(Array.from(e.target.files || []))}
      />
      
      <div className={cn(
        "p-6 rounded-[2rem] transition-all duration-300",
        state.isDragging ? "bg-[#D4AF37] text-white rotate-12" : "bg-slate-100 text-slate-400 group-hover:bg-[#2D5A3D] group-hover:text-white"
      )}>
        <Upload size={40} strokeWidth={3} />
      </div>

      <div className="text-center space-y-2">
        <p className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
          {state.isDragging ? "Pode soltar!" : "Arraste suas fotos aqui"}
        </p>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Ou clique para navegar nos arquivos</p>
      </div>
      
      {state.isUploading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center rounded-[2.8rem] z-20 animate-in fade-in">
          <Loader2 className="h-10 w-10 animate-spin text-[#2D5A3D] mb-4" />
          <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Enviando para o servidor...</p>
        </div>
      )}
    </div>
  );
}