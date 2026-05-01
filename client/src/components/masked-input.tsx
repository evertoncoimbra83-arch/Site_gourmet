import React, { forwardRef } from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { Input } from "@/components/ui/input";
import { InputMask, type Replacement } from "@react-input/mask";

interface MaskedInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  mask: string; 
  replacement: string | Replacement; 
}

/**
 * Componente MaskedInput
 * Integra a lógica de máscara do @react-input/mask com o estilo do Shadcn UI
 */
export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, replacement, ...props }, ref) => {
    return (
      <InputMask 
        component={Input} 
        mask={mask} 
        replacement={replacement} 
        {...props} 
        ref={ref} 
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";