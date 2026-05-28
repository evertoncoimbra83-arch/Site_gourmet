import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  Stethoscope,
  ClipboardList,
  UserCheck,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Clock,
  HeartHandshake,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

export default function NutriPublicLanding() {
  const faqSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Existe alguma taxa de adesão ou mensalidade?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Não. A plataforma Gourmet Nutri é 100% gratuita para nutricionistas cadastrados e ativos. Nosso objetivo é facilitar a entrega do seu planejamento."
          }
        },
        {
          "@type": "Question",
          "name": "Como meu cadastro profissional é validado?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nossa equipe administrativa analisa e confere o número do seu CRN e jurisdição fornecido no cadastro com os dados oficiais do conselho federal. A liberação ocorre em até 24h úteis."
          }
        },
        {
          "@type": "Question",
          "name": "Como meu paciente recebe o plano montado?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ao cadastrar um paciente com e-mail ou telefone e montar o plano, um link exclusivo é gerado. Você pode enviar diretamente para o WhatsApp do paciente. Ao clicar, ele visualiza o plano com as opções e adiciona tudo ao carrinho."
          }
        },
        {
          "@type": "Question",
          "name": "Os pratos possuem identificação de ingredientes e porções?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sim. Todos os pratos do catálogo do Gourmet Saudável contam com fichas técnicas detalhadas, pesos e macros específicos, os quais são exibidos no painel do profissional e na tela do paciente."
          }
        }
      ]
    };
  }, []);

  const steps = [
    {
      number: "01",
      icon: <Stethoscope className="w-6 h-6 text-emerald-600" />,
      title: "Cadastro Profissional",
      description: "Preencha seus dados básicos e informe seu CRN de forma rápida.",
    },
    {
      number: "02",
      icon: <UserCheck className="w-6 h-6 text-emerald-600" />,
      title: "Validação & Acesso",
      description: "Validamos seu registro ativo e liberamos seu painel em até 24 horas.",
    },
    {
      number: "03",
      icon: <ClipboardList className="w-6 h-6 text-emerald-600" />,
      title: "Prescreva Pratos",
      description: "Monte sugestões de refeições com pratos e tamanhos reais do catálogo.",
    },
    {
      number: "04",
      icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />,
      title: "Facilidade de Compra",
      description: "Seu paciente compra a dieta montada diretamente com desconto especial.",
    },
  ];

  const benefits = {
    nutri: [
      "Facilite a adesão dos seus pacientes ao plano alimentar proposto",
      "Economize tempo com a criação e reutilização de templates de dieta",
      "Acompanhe o engajamento e o histórico de compras de cada paciente",
      "Ofereça cupom de 10% de desconto exclusivo para seus recomendados",
    ],
    patient: [
      "Comida de verdade, ultracongelada e pronta para consumo em 5 minutos",
      "Garantia de peso, porcionamento e macronutrientes exatos",
      "Sem atrito de cozinhar, pesar ou preparar marmitas semanais",
      "Praticidade que ajuda a manter a consistência na dieta",
    ],
  };

  const patientJourney = [
    {
      title: "Nutricionista prescreve",
      desc: "Você cria o plano e associa os pratos no painel profissional.",
    },
    {
      title: "Paciente recebe o link",
      desc: "Um link seguro é gerado e enviado por WhatsApp/E-mail.",
    },
    {
      title: "Visualização organizada",
      desc: "O paciente abre a página com as refeições estruturadas e suas dicas.",
    },
    {
      title: "Compra unificada",
      desc: "Com 1 clique no botão 'Comprar Plano Completo', os pratos vão à sacola.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-900 pb-20 font-sans">
      <SEO
        title="Parceria para Nutricionistas e Clínicas | Gourmet Saudável"
        description="Aumente a adesão dos seus pacientes prescrevendo marmitas congeladas saudáveis e práticas com macros calculados e desconto exclusivo."
        path="/nutricionistas"
        schemaMarkup={faqSchema}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 bg-linear-to-b from-emerald-50/40 to-transparent">
        <div className="container mx-auto px-6 max-w-5xl text-center space-y-8 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Credenciamento Profissional Gratuito
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight">
            Prescreva praticidade com <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500 italic">
              refeições saudáveis prontas.
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Ajude seus pacientes a manterem a consistência. Monte planos alimentares práticos usando o catálogo equilibrado do Gourmet Saudável.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Link to="/nutri/cadastro">
              <Button className="h-16 px-10 rounded-full bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                Solicitar Credenciamento <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-5xl text-center space-y-16">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Passo a Passo
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Como Funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, idx) => (
              <div key={idx} className="bg-[#FBFBFC] p-8 rounded-[2.5rem] border border-slate-100 space-y-4 text-left relative group hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-xs">
                    {s.icon}
                  </div>
                  <span className="text-3xl font-black text-slate-200 group-hover:text-emerald-100 transition-colors">
                    {s.number}
                  </span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 pt-2">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que o paciente vê */}
      <section className="py-20 bg-[#FBFBFC]">
        <div className="container mx-auto px-6 max-w-5xl text-center space-y-16">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Experiência Prática
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              O que o paciente vê
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Entenda como a recomendação chega sem fricção na mesa do seu paciente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative">
            {patientJourney.map((j, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3 shadow-xs relative">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center">
                  {idx + 1}
                </div>
                <h3 className="text-xs font-black uppercase italic text-slate-800 leading-tight">
                  {j.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {j.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios Grid */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-5xl space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Vantagens do Credenciamento
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Valor para Ambos os Lados
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Para o Profissional */}
            <div className="bg-slate-50 p-8 md:p-12 rounded-[3rem] border border-slate-100 space-y-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black uppercase italic text-slate-800">
                  Para Você (Nutricionista)
                </h3>
              </div>
              <ul className="space-y-4">
                {benefits.nutri.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Para o Paciente */}
            <div className="bg-slate-50 p-8 md:p-12 rounded-[3rem] border border-slate-100 space-y-8">
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black uppercase italic text-slate-800">
                  Para Seu Paciente
                </h3>
              </div>
              <ul className="space-y-4">
                {benefits.patient.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm font-medium text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-3xl text-left space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Dúvidas Frequentes
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Perguntas de Parceiros
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white px-6 py-2 rounded-3xl border border-slate-150 shadow-xs">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Existe alguma taxa de adesão ou mensalidade?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Não. A plataforma Gourmet Nutri é 100% gratuita para nutricionistas cadastrados e ativos. Nosso objetivo é facilitar a entrega do seu planejamento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white px-6 py-2 rounded-3xl border border-slate-155 shadow-xs">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Como meu cadastro profissional é validado?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Nossa equipe administrativa analisa e confere o número do seu CRN e jurisdição fornecido no cadastro com os dados oficiais do conselho federal. A liberação ocorre em até 24h úteis.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white px-6 py-2 rounded-3xl border border-slate-155 shadow-xs">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Como meu paciente recebe o plano montado?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Ao cadastrar um paciente com e-mail ou telefone e montar o plano, um link exclusivo é gerado. Você pode enviar diretamente para o WhatsApp do paciente. Ao clicar, ele visualiza o plano com as opções e adiciona tudo ao carrinho.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white px-6 py-2 rounded-3xl border border-slate-155 shadow-xs">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Os pratos possuem identificação de ingredientes e porções?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Sim. Todos os pratos do catálogo do Gourmet Saudável contam com fichas técnicas detalhadas, pesos e macros específicos, os quais são exibidos no painel do profissional e na tela do paciente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-slate-900 text-white text-center rounded-[3.5rem] md:rounded-[5rem] mx-4 relative z-10 shadow-3xl">
        <div className="container mx-auto px-6 max-w-xl space-y-8">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
            Pronto para otimizar a <br />
            <span className="text-emerald-400">rotina do seu consultório?</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Cadastre-se gratuitamente hoje e comece a prescrever refeições saudáveis de verdade para seus pacientes.
          </p>
          <div className="pt-2">
            <Link to="/nutri/cadastro">
              <Button className="h-16 px-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                Cadastrar-se Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
