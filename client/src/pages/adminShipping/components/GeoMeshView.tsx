import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { appToast as toast } from "@/lib/app-toast";
import { Database, MapPinned, RefreshCw, Zap, Upload, Server } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useShippingMesh, GeoMeshItem } from "../logic/useShippingMesh";

export function GeoMeshView() {
  // ✅ Usando o SEU hook que já tem tudo configurado corretamente
  const { data, state, actions } = useShippingMesh();
  const { knownMesh } = data;
  const { isLoading, isImporting, isSyncing } = state;

  // 🛡️ Tipagem ajustada usando a sua GeoMeshItem
  const groupedData = useMemo(() => {
    if (!knownMesh || !Array.isArray(knownMesh) || knownMesh.length === 0) return {};
    
    return knownMesh.reduce((acc: Record<string, GeoMeshItem[]>, item: GeoMeshItem) => {
      const cidade = item.cidade || "OUTRAS LOCALIDADES";
      if (!acc[cidade]) acc[cidade] = [];
      acc[cidade].push(item);
      return acc;
    }, {});
  }, [knownMesh]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(json)) {
          throw new Error("O arquivo JSON deve conter um array de objetos.");
        }
        
        const validatedRows = [];
        for (let i = 0; i < json.length; i++) {
          const item = json[i];
          if (!item || typeof item !== "object") {
            throw new Error(`Item no índice ${i} não é um objeto válido.`);
          }
          
          const row = item as Record<string, unknown>;
          const cep = String(row.cep || row.zipCode || "").trim().replace(/\D/g, "");
          const cidade = String(row.cidade || row.city || "").trim();
          const bairro = String(row.bairro || row.neighborhood || "Centro").trim();
          const lat = row.lat !== undefined ? row.lat : row.latitude;
          const lng = row.lng !== undefined ? row.lng : row.longitude;
          
          if (!cep) {
            throw new Error(`Item no índice ${i} está com o CEP/zipCode ausente.`);
          }
          if (cep.length !== 8) {
            throw new Error(`Item no índice ${i} está com o CEP/zipCode inválido (deve conter 8 dígitos, ex: 13200000).`);
          }
          if (!cidade) {
            throw new Error(`Item no índice ${i} está com a Cidade/city ausente.`);
          }
          
          const parsedLat = parseFloat(String(lat));
          const parsedLng = parseFloat(String(lng));
          
          if (isNaN(parsedLat) || isNaN(parsedLng)) {
            throw new Error(`Item no índice ${i} está com coordenadas lat/lng inválidas.`);
          }
          
          validatedRows.push({
            cep,
            cidade,
            bairro,
            lat: parsedLat,
            lng: parsedLng,
          });
        }
        
        if (validatedRows.length === 0) {
          throw new Error("Nenhum CEP válido foi encontrado no arquivo.");
        }

        actions.handleImportMesh(validatedRows);
      } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error("Formato inválido: " + message); 
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Server className="animate-pulse text-emerald-500" size={40} />
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Consultando Malha no Servidor...</p>
      </div>
    );
  }

  const cidadesAbertasPorPadrao = Object.keys(groupedData);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Malha <span className="text-emerald-600">Geográfica</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">
            Cache de Cobertura do Servidor
          </p>
        </div>

        <div className="flex gap-3">
          {/* BOTÃO DE SINCRONIZAÇÃO USANDO SUA ACTION */}
          <Button 
            onClick={() => actions.handleSyncMesh()}
            disabled={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
          >
            {isSyncing ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Zap size={16} className="mr-2" />}
            {isSyncing ? "Processando..." : "Gerar Malha Mestra"}
          </Button>

          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            <div className="flex items-center gap-2 bg-slate-900 text-white px-6 h-12 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              <Upload size={16} /> 
              {isImporting ? "Importando..." : "Importar JSON"}
            </div>
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none shadow-2xl shadow-emerald-100 rounded-4xl bg-emerald-600 text-white relative overflow-hidden flex flex-col justify-center min-h-40">
          <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">CEPs em Cache (Ativos)</p>
          <p className="text-6xl font-black mt-2 italic tracking-tighter leading-none">
            {Array.isArray(knownMesh) ? knownMesh.length : 0}
          </p>
          <Database size={100} className="absolute -right-6 -bottom-6 opacity-[0.08]" />
        </Card>

        <Card className="md:col-span-2 p-8 border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-4xl bg-white flex items-center justify-between">
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-black uppercase italic text-slate-800 tracking-tight">Como funciona o Radar?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              O sistema cruza as regras desenhadas no mapa com a base de dados de CEPs. O botão &quot;Gerar Malha Mestra&quot; processa essas regras e salva o resultado final no servidor para acelerar o checkout.
            </p>
          </div>
          <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-emerald-500/20 border border-slate-100 shrink-0">
            <Server size={40} />
          </div>
        </Card>
      </div>

      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Distribuição Territorial</h2>
        </div>

        <div className="p-6">
          {cidadesAbertasPorPadrao.length > 0 ? (
            <Accordion type="multiple" defaultValue={cidadesAbertasPorPadrao} className="space-y-4">
              {Object.entries(groupedData).map(([cidade, ceps]) => (
                <AccordionItem key={cidade} value={cidade} className="border border-slate-100 rounded-4xl px-8 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="hover:no-underline py-8 outline-none">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                        <MapPinned size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black uppercase tracking-tight text-slate-900 italic leading-none mb-1">{cidade}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{ceps.length} rotas em cache</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden max-h-100 overflow-y-auto scrollbar-hide">
                      <table className="w-full text-left">
                        <thead className="bg-white text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-8 py-5">Código Postal</th>
                            <th className="px-8 py-5">Região / Bairro</th>
                            <th className="px-8 py-5">Coordenadas</th>
                            <th className="px-8 py-5 text-right">Última Sincronia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {ceps.map((item: GeoMeshItem, index: number) => (
                            <tr key={`${item.cep}-${index}`} className="text-xs hover:bg-white transition-colors group">
                              <td className="px-8 py-4 font-black text-slate-900 font-mono text-sm tracking-tighter">
                                {item.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                              </td>
                              <td className="px-8 py-4 font-bold text-slate-500 uppercase text-[10px]">{item.bairro || "NÃO INFORMADO"}</td>
                              <td className="px-8 py-4 font-mono text-[10px] text-slate-400">{item.lat}, {item.lng}</td>
                              <td className="px-8 py-4 text-right text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                {item.lastSeen ? new Date(item.lastSeen).toLocaleDateString('pt-BR') : "RECÉM-CRIADO"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="p-24 flex flex-col items-center justify-center">
              <div className="p-6 bg-slate-50 rounded-full mb-6">
                <Database size={48} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] text-center max-w-sm leading-relaxed">
                A base está vazia. Você pode importar um JSON inicial ou clicar em &quot;Gerar Malha Mestra&quot;.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}