// src/_core/hooks/useVisitorId.ts
import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string | null>(() => {
    // Tenta pegar do cache primeiro para ser instantâneo
    return localStorage.getItem("visitor_device_id");
  });

  useEffect(() => {
    // Se já temos, não precisa recalcular
    if (visitorId) return;

    const setFp = async () => {
      try {
        // Carrega o agente
        const agent = await FingerprintJS.load();
        
        // Gera o hash único do dispositivo
        const result = await agent.get();
        
        const id = result.visitorId;
        
        setVisitorId(id);
        localStorage.setItem("visitor_device_id", id);
        
        
      } catch (error) {
        console.error("Erro ao gerar fingerprint:", error);
      }
    };

    setFp();
  }, [visitorId]);

  return visitorId;
}