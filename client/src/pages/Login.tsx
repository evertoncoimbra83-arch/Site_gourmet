import { useLogin } from "./login/logic/useLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { PasswordInput } from '@/components/PasswordInput';
import { usePasswordStrength } from '@/_core/hooks/usePasswordStrength';
import { SEO } from "@/components/SEO";

export default function LoginPage() {
  const { state, actions } = useLogin();
  const { strength } = usePasswordStrength(state.password, [state.email, state.name]);

  if (!state.authLoading && state.isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 mx-auto mb-4 rounded-lg" />}
          <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          <p className="text-gray-600">{state.isLogin ? "Faça login na sua conta" : "Crie sua conta"}</p>
        </div>

        <form onSubmit={actions.handleSubmit} className="space-y-4">
          {!state.isLogin && (
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input 
                value={state.name} 
                onChange={(e) => actions.setName(e.target.value)} 
                placeholder="Nome completo" 
                disabled={state.isLoading} 
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input 
              type="email" 
              value={state.email} 
              onChange={(e) => actions.setEmail(e.target.value)} 
              placeholder="seu@email.com" 
              disabled={state.isLoading} 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <PasswordInput 
              value={state.password} 
              onChange={(e) => actions.setPassword(e.target.value)} 
              disabled={state.isLoading} 
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={state.isLoading}>
            {state.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (state.isLogin ? "Entrar" : "Cadastrar")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button 
            type="button" 
            onClick={() => actions.setIsLogin(!state.isLogin)} 
            className="text-green-600 hover:underline font-medium"
          >
            {state.isLogin ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
          </button>
        </div>
      </Card>
    </div>
  );
}