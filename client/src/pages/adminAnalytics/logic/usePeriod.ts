import { useState, useEffect } from "react";

export type PeriodPreset = "today" | "7d" | "30d" | "90d" | "current_month" | "custom";

export interface SelectedPeriod {
  preset: PeriodPreset;
  startDate?: string;
  endDate?: string;
}

const STORAGE_KEY = "gourmet_admin_period";
const DEFAULT_PERIOD: SelectedPeriod = { preset: "30d" };

export function getStoredPeriod(): SelectedPeriod {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Erro ao ler período do localStorage:", e);
  }
  return DEFAULT_PERIOD;
}

export function setStoredPeriod(period: SelectedPeriod) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  } catch (e) {
    console.error("Erro ao salvar período no localStorage:", e);
  }
}

export function usePeriod() {
  const [period, setPeriod] = useState<SelectedPeriod>(() => getStoredPeriod());

  const updatePeriod = (newPeriod: SelectedPeriod) => {
    setPeriod(newPeriod);
    setStoredPeriod(newPeriod);
    window.dispatchEvent(new Event("admin-period-changed"));
  };

  useEffect(() => {
    const handleStorage = () => {
      setPeriod(getStoredPeriod());
    };
    window.addEventListener("admin-period-changed", handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("admin-period-changed", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return [period, updatePeriod] as const;
}
