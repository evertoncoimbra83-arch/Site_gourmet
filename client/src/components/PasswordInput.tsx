// client/src/components/PasswordInput.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// O componente vai receber todas as props que o componente Input recebe
interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  containerClassName?: string;
}

export function PasswordInput({
  className,
  containerClassName,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => setShowPassword((prev) => !prev);

  // Define o tipo do input com base no estado 'showPassword'
  const inputType = showPassword ? "text" : "password";

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        type={inputType} 
        className={cn("pr-10", className)} // Adiciona padding à direita para o botão
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
        onClick={toggleVisibility}
        title={showPassword ? "Esconder senha" : "Mostrar senha"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}