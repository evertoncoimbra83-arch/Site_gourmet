import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Camera,
  Link2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  KeyRound,
  Info,
} from "lucide-react";
import { trpc } from "@/_core/trpc";

interface NfceQrScannerProps {
  onClose: () => void;
}

type ScanMode = "idle" | "camera" | "manual";

export function NfceQrScanner({ onClose }: NfceQrScannerProps) {
  const [mode, setMode] = useState<ScanMode>("idle");
  const [manualInput, setManualInput] = useState("");
  const [scannedText, setScannedText] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const parseMutation = trpc.admin.purchases.parseNfceQrUrl.useMutation();

  const handleScanResult = useCallback(
    (text: string) => {
      setScannedText(text);
      setMode("idle");
      parseMutation.mutate({ urlOrKey: text });
    },
    [parseMutation],
  );

  // Inicializar câmera quando mode === "camera"
  useEffect(() => {
    if (mode !== "camera") return;

    const scanner = new Html5QrcodeScanner(
      "nfce-qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false,
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        scanner
          .clear()
          .then(() => {
            handleScanResult(decodedText);
          })
          .catch((err) => {
            console.error("Erro ao limpar scanner NFC-e:", err);
            handleScanResult(decodedText);
          });
      },
      () => {
        // Erros de leitura ignorados (foco, baixa luminosidade, etc.)
      },
    );

    return () => {
      scanner
        .clear()
        .catch((err) =>
          console.error("Erro ao fechar scanner NFC-e no unmount:", err),
        );
      scannerRef.current = null;
    };
  }, [mode, handleScanResult]);

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    handleScanResult(trimmed);
  };

  const handleReset = () => {
    setScannedText("");
    setManualInput("");
    setMode("idle");
    parseMutation.reset();
  };

  const result = parseMutation.data;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-4xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors p-1 z-10"
        >
          <X size={24} />
        </button>

        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">
            Escanear <span className="text-emerald-500">NFC-e</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Leitura de QR Code de cupom fiscal
          </p>
        </div>

        {/* Seleção de modo (apenas se não tiver resultado e não estiver escaneando) */}
        {mode === "idle" && !scannedText && (
          <div className="space-y-3">
            <Button
              onClick={() => setMode("camera")}
              className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
            >
              <Camera size={20} />
              Abrir Câmera e Escanear QR Code
            </Button>
            <Button
              onClick={() => setMode("manual")}
              variant="outline"
              className="w-full h-14 rounded-2xl border-slate-200 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3"
            >
              <Link2 size={20} />
              Colar Link da Nota Manualmente
            </Button>
          </div>
        )}

        {/* Modo Câmera */}
        {mode === "camera" && (
          <div className="space-y-4">
            <div
              id="nfce-qr-reader"
              className="overflow-hidden rounded-2xl border-4 border-slate-50 bg-slate-50 min-h-[280px]"
            />
            <Button
              onClick={() => setMode("idle")}
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
            >
              Cancelar Câmera
            </Button>
          </div>
        )}

        {/* Modo Manual */}
        {mode === "manual" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                Cole a URL do QR Code ou a chave de acesso de 44 dígitos
              </label>
              <Input
                placeholder="https://www.nfce.fazenda.sp.gov.br/...?chNFe=3526..."
                className="h-14 rounded-2xl bg-slate-50 border-none shadow-sm font-bold text-xs text-slate-700 px-5"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setMode("idle")}
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider transition-all active:scale-95"
              >
                Validar
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {parseMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-500 uppercase">
              Validando chave de acesso...
            </p>
          </div>
        )}

        {/* Erro da mutação */}
        {parseMutation.isError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-center space-y-3">
            <ShieldAlert className="mx-auto text-red-500" size={28} />
            <p className="text-xs font-bold text-red-700">
              {parseMutation.error?.message ||
                "Não foi possível extrair uma chave válida do texto fornecido."}
            </p>
            <Button
              onClick={handleReset}
              variant="outline"
              className="h-10 px-6 rounded-xl font-bold text-xs"
            >
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Resultado de sucesso */}
        {result && !parseMutation.isPending && (
          <div className="mt-6 space-y-4 animate-in fade-in duration-200">
            {/* Card de Status */}
            <div
              className={`p-5 rounded-2xl border ${
                result.isValid
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-red-50/50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {result.isValid ? (
                  <ShieldCheck className="text-emerald-600" size={24} />
                ) : (
                  <ShieldAlert className="text-red-600" size={24} />
                )}
                <div>
                  <p
                    className={`text-sm font-black uppercase ${
                      result.isValid ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {result.isValid
                      ? "Chave Válida (Mod 11)"
                      : "Chave Inválida"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Validação matemática do dígito verificador
                  </p>
                </div>
              </div>

              {/* Chave Mascarada */}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <KeyRound
                    size={14}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      Chave de Acesso
                    </p>
                    <p className="text-sm font-bold text-slate-800 font-mono tracking-wide mt-0.5">
                      {result.maskedKey}
                    </p>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-start gap-2.5">
                  <MapPin
                    size={14}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      UF Emissora
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {result.state}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso informativo */}
            {result.isValid && (
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-2.5">
                <Info
                  size={16}
                  className="text-sky-600 shrink-0 mt-0.5"
                />
                <p className="text-[10px] font-bold text-sky-800 leading-relaxed">
                  QR Code identificado com sucesso. Para importar os itens desta
                  nota fiscal no momento, utilize a{" "}
                  <strong>importação manual de XML</strong>. A importação direta
                  pela URL do QR Code será implementada em fases futuras.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold text-xs"
              >
                Escanear Outro
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-wider transition-all"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        {/* Botão fechar no modo idle sem resultado */}
        {mode === "idle" && !scannedText && (
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-6 h-12 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
