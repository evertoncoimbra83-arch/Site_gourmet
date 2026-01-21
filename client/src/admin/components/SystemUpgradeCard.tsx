// src/admin/components/SystemUpgradeCard.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function SystemUpgradeCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error("Selecione o arquivo .zip primeiro.");
    
    // Confirmação para evitar cliques acidentais
    if (!confirm("O servidor irá reiniciar e o site ficará fora do ar por alguns segundos. Confirmar?")) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('package', file);

    // Lendo as chaves secretas do seu .env
    const secretPath = import.meta.env.VITE_DEPLOY_ROUTE_PATH;
    const secretKey = import.meta.env.VITE_DEPLOY_SECRET_KEY;

    try {
      const response = await fetch(`/api/${secretPath}`, {
        method: 'POST',
        headers: {
          'x-api-key': secretKey
        },
        body: formData
      });

      if (response.ok) {
        toast.success("Pacote enviado! Reiniciando sistema...");
        // Delay para dar tempo do servidor processar antes de recarregar a página
        setTimeout(() => {
          window.location.reload();
        }, 8000);
      } else {
        const err = await response.text();
        toast.error(`Falha no upgrade: ${err}`);
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor durante o upgrade.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tighter">Núcleo de Atualização</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Versão 1.0.4 - Alpha Internal</p>
        </div>
      </div>

      <div className="p-6 border-2 border-dashed border-slate-100 rounded-4xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-4">
        <input 
          type="file" 
          accept=".zip" 
          id="system-zip"
          className="hidden" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label 
          htmlFor="system-zip" 
          className="cursor-pointer flex flex-col items-center group"
        >
          <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-all mb-2">
            <Upload size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {file ? file.name : "Clique para selecionar o pacote .zip"}
          </span>
        </label>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold leading-tight uppercase italic">
          Atenção: Subir um pacote corrompido ou incompleto pode travar o servidor. Certifique-se de que o build offline foi concluído com sucesso.
        </p>
      </div>

      <Button 
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-200"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            INSTALANDO PACOTE...
          </>
        ) : "IMPLANTAR NOVA VERSÃO"}
      </Button>
    </div>
  );
}