import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    // Configuração do Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 280, height: 150 }, // Formato retangular ideal para códigos de barras
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Sucesso na leitura: limpa o scanner e retorna o código
        scanner.clear().then(() => {
          onScan(decodedText);
        }).catch(err => {
          console.error("Erro ao limpar scanner:", err);
          // Mesmo com erro ao limpar, tentamos retornar o código
          onScan(decodedText);
        });
      },
      () => { 
        /** * ✅ CORREÇÃO DEFINITIVA: 
         * Removido o argumento 'error' para satisfazer o ESLint (no-unused-vars).
         * Erros de leitura (como frame fora de foco) ocorrem várias vezes por segundo
         * e são ignorados intencionalmente pela biblioteca para não travar a câmera.
         */
      }
    );

    // Limpeza ao desmontar o componente para desligar a câmera
    return () => {
      scanner.clear().catch(err => console.error("Erro ao fechar scanner no unmount:", err));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-4xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X size={24} />
        </button>

        <div className="mb-6 text-center">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">
            Escanear <span className="text-emerald-500">Código</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Aponte a câmera para o código de barras do produto
          </p>
        </div>

        {/* Container onde a câmera será injetada pelo Html5QrcodeScanner */}
        <div 
          id="reader" 
          className="overflow-hidden rounded-2xl border-4 border-slate-50 bg-slate-50 min-h-62.5"
        ></div>

        <Button 
          onClick={onClose} 
          variant="outline"
          className="w-full mt-6 h-12 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
        >
          Cancelar Busca
        </Button>
      </div>
    </div>
  );
}