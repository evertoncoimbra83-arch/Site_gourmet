import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  const companyName = "Gourmet Saudável";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-20 text-left">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header da Página */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-3xl mb-4">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Política de <span className="text-emerald-600">Privacidade</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            Última atualização: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="rounded-4xl border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 md:p-16 prose prose-slate max-w-none">
            
            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-xl font-black uppercase italic text-slate-800">
                <Eye className="text-emerald-500" /> 1. Coleta de Informações
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Ao utilizar o <strong>{companyName}</strong>, coletamos informações necessárias para a prestação do serviço, como:
              </p>
              <ul className="list-disc pl-5 text-slate-600 space-y-2">
                <li><strong>Informações de Conta:</strong> Nome, e-mail e foto de perfil (via Google Login).</li>
                <li><strong>Dados de Pedido:</strong> Endereço de entrega, telefone e histórico de compras.</li>
                <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de dispositivo e cookies para melhorar a experiência.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-xl font-black uppercase italic text-slate-800">
                <Lock className="text-emerald-500" /> 2. Uso dos Dados
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-5 text-slate-600 space-y-2">
                <li>Processar seus pedidos e realizar entregas.</li>
                <li>Personalizar sua experiência no sistema.</li>
                <li>Garantir a segurança da sua conta e prevenir fraudes.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="flex items-center gap-3 text-xl font-black uppercase italic text-slate-800">
                <FileText className="text-emerald-500" /> 3. Compartilhamento
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Não vendemos seus dados a terceiros. O compartilhamento ocorre apenas com parceiros essenciais (ex: gateways de pagamento e serviços de entrega).
              </p>
            </section>

            <section className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <h3 className="text-sm font-black uppercase text-slate-800 mb-2">Exclusão de Dados</h3>
              <p className="text-xs text-slate-500 font-bold uppercase leading-relaxed">
                Você pode solicitar a exclusão de sua conta e todos os dados vinculados a qualquer momento enviando um e-mail para o suporte ou através das configurações de perfil.
              </p>
            </section>

          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {companyName} &copy; {new Date().getFullYear()} - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}