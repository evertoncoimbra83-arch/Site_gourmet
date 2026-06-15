import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HomeFaq() {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-6 text-left max-w-3xl">
        <div className="text-center mb-16 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
            Dúvidas Frequentes
          </span>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Perguntas Frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem
            value="item-1"
            className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm"
          >
            <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
              Como os pratos são conservados?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
              Nossos pratos são preparados com ingredientes 100% frescos e
              congelados através de um processo de ultracongelamento rápido.
              Isso impede a formação de cristais de gelo, conservando a textura,
              os nutrientes e o sabor original por até 90 dias no freezer.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-2"
            className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm"
          >
            <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
              Como aquecer as refeições?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
              Basta retirar o selo plástico protetor e levar a marmita
              diretamente ao micro-ondas por 5 a 7 minutes (o tempo varia de
              acordo com a potência do aparelho). Também é possível aquecer em
              forno convencional pré-aquecido por cerca de 25 minutos.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-3"
            className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm"
          >
            <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
              Aceitam Vale-Refeição e Vale-Alimentação?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
              Aceitamos Pix, cartões e principais vales-refeição/benefício. As
              opções exibidas no checkout seguem a configuração ativa da loja.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-4"
            className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm"
          >
            <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
              Como funciona o acúmulo de pontos de fidelidade?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
              A cada pedido feito no site, 10% do valor total pago é convertido
              em pontos de fidelidade na sua conta. Cada 100 pontos equivalem a
              R$ 1.00 de desconto, que pode ser ativado a qualquer momento no
              carrinho de compras.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
