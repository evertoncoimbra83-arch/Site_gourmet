import { useAdminMedia } from "../logic/useAdminMedia";
import { UploadZone } from "../components/UploadZone";
import { MediaCard } from "../components/MediaCard";
import { Loader2, Image as ImageIcon, Sparkles, FolderOpen, Bug } from "lucide-react";

export function AdminMediaView() {
  const { state, actions, data, refs } = useAdminMedia();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Sparkles size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestão de Assets</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Biblioteca de <span className="text-emerald-600">Mídia</span><span className="text-emerald-600">.</span>
          </h1>
        </div>
      </header>

      {/* ÁREA DE UPLOAD */}
      <div className="bg-white rounded-[3rem] p-2 shadow-sm border border-slate-100 overflow-hidden">
         <UploadZone state={state} actions={actions} refs={refs} />
      </div>

      {/* GALERIA DE MÍDIA */}
      <section className="space-y-6">
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-start">
            <span className="bg-[#F8FAFC] pr-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 flex items-center gap-2">
              <FolderOpen size={12} /> Arquivos Armazenados
            </span>
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-50 min-h-[400px]">
          {state.isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <Loader2 className="animate-spin text-emerald-600" size={56} strokeWidth={1.5} />
            </div>
          ) : data.media.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed rounded-[3rem] border-slate-100 bg-slate-50/30">
              <ImageIcon className="h-10 w-10 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-[11px] tracking-widest">Nenhum ativo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
              {data.media.map((item: any) => {
                const fullImageUrl = actions.getFullUrl(item.url || item.filePath);
                
                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -top-4 left-0 right-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/80 text-[8px] text-white p-2 rounded-lg font-mono break-all leading-tight shadow-2xl border border-white/20">
                           <div className="flex items-center gap-1 text-yellow-400 mb-1">
                             <Bug size={8} /> <span>DEBUG PATH:</span>
                           </div>
                           {fullImageUrl}
                        </div>
                    </div>

                    <div onClick={() => console.log("🔍 Inspecionando Item:", { id: item.id, url_db: item.url, full_constructed: fullImageUrl })}>
                      <MediaCard 
                        item={{ ...item, displayUrl: fullImageUrl }} 
                        onCopy={() => {
                          console.log("📋 Copiado:", fullImageUrl);
                          actions.copyToClipboard(fullImageUrl);
                        }} 
                        onDelete={() => actions.handleDelete(item.id)} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* DICA OPERACIONAL */}
      <footer className="flex justify-center pt-8">
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-900 rounded-full shadow-xl">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">
             Debug Mode Ativo: Passe o mouse sobre as imagens para ver o endereço.
           </span>
        </div>
      </footer>
    </div>
  );
}