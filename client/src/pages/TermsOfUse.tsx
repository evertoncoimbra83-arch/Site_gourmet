import React from "react"; // ✅ Adicionado para satisfazer o ESLint
import { Card, CardContent } from "@/components/ui/card";
import { Scale, FileText, ShieldAlert, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function TermsOfUse() {
  const companyName = "Gourmet Saudável";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-20 italic">
      <SEO 
        title="Termos de Uso" 
        description="Leia os Termos de Uso do Gourmet Saudável. Conheça as diretrizes para utilização de nossa plataforma e pedidos de marmitas congeladas." 
        path="/termos" 
      />
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-amber-100 text-amber-600 rounded-3xl mb-4">
            <Scale size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Termos de <span className="text-amber-600">Uso</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            Leia com atenção as regras da nossa plataforma
          </p>
        </div>

        <Card className="rounded-4xl border-none shadow-xl overflow-hidden bg-white">
          <CardContent className="p-10 md:p-16 space-y-10">
            
            <section>
              <h2 className="flex items-center gap-3 text-xl font-black uppercase text-slate-800 mb-4">
                <FileText className="text-amber-500" /> 1. Aceitação dos Termos
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Ao acessar o <strong>{companyName}</strong>, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar este site.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-xl font-black uppercase text-slate-800 mb-4">
                <ShieldAlert className="text-amber-500" /> 2. Uso de Conta
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Você é responsável por manter a confidencialidade dos seus dados de login e por todas as atividades que ocorrem em sua conta. O uso do Google Login simplifica este processo, mas a segurança do seu e-mail permanece sob sua responsabilidade.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-3 text-xl font-black uppercase text-slate-800 mb-4">
                <CheckCircle className="text-amber-500" /> 3. Pedidos e Pagamentos
              </h2>
              <ul className="list-disc pl-5 text-slate-600 space-y-2 font-medium">
                <li>Os preços e disponibilidade de produtos podem sofrer alterações sem aviso prévio.</li>
                <li>O cancelamento de pedidos segue as regras de tempo de preparo estabelecidas pela loja.</li>
                <li>O sistema de fidelidade e pontos é pessoal e intransferível.</li>
              </ul>
            </section>

            <div className="p-8 bg-amber-50 rounded-3xl border border-dashed border-amber-200 text-center">
              <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">
                Dúvidas sobre os termos? Entre em contato com nosso suporte via WhatsApp.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}