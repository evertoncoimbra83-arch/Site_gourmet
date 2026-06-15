import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import type { CepStatus } from "../types";

export function useHomeCep() {
  const [cepInput, setCepInput] = useState("");
  const [checkingCep, setCheckingCep] = useState(false);
  const [cepStatus, setCepStatus] = useState<CepStatus | null>(null);
  const trpcContext = trpc.useUtils();

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 5) {
      val = val.substring(0, 5) + "-" + val.substring(5, 8);
    }
    setCepInput(val);
    setCepStatus(null);
  };

  const handleCheckCep = async () => {
    const clean = cepInput.replace(/\D/g, "");
    if (clean.length < 8) return;
    setCheckingCep(true);
    try {
      const res = await trpcContext.store.public.getCep.fetch({ cep: clean });
      if (res && res.city) {
        setCepStatus({
          success: true,
          message: `✓ Entregamos em ${res.neighborhood || res.city} (${res.city} - ${res.state})!`,
        });
      } else {
        setCepStatus({
          success: false,
          message: "✗ CEP não localizado ou fora da área de entrega.",
        });
      }
    } catch (err) {
      setCepStatus({
        success: false,
        message: "✗ Erro ao consultar o CEP. Tente novamente.",
      });
    } finally {
      setCheckingCep(false);
    }
  };

  return {
    cepInput,
    checkingCep,
    cepStatus,
    handleCepChange,
    handleCheckCep,
  };
}
