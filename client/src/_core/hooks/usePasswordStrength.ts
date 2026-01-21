import { useMemo } from "react";

/**
 * Hook para calcular a força de uma senha e retornar label, cor e critérios.
 */
export function usePasswordStrength(password: string) {
  const strength = useMemo(() => {
    const requirements = [
      { id: 0, label: "Pelo menos 6 caracteres", met: password.length >= 6 },
      { id: 1, label: "Pelo menos uma letra maiúscula", met: /[A-Z]/.test(password) },
      { id: 2, label: "Pelo menos um número", met: /\d/.test(password) },
      { id: 3, label: "Pelo menos um caractere especial", met: /[^A-Za-z0-9]/.test(password) },
    ];

    const score = requirements.filter((req) => req.met).length;

    let label = "Muito fraca";
    let color = "bg-slate-200"; // Cor neutra/vazia

    if (password.length > 0) {
      if (score <= 1) {
        label = "Fraca";
        color = "bg-red-500";
      } else if (score <= 3) {
        label = "Média";
        color = "bg-yellow-500";
      } else {
        label = "Forte";
        color = "bg-emerald-500";
      }
    } else {
      label = "";
    }

    return {
      score,
      label,
      color,
      requirements,
    };
  }, [password]);

  return strength;
}