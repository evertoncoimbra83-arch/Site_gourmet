// server/routers/supportRouter.ts
import { z } from "zod";
import { router, publicProcedure } from "../../../../server/_core/trpc.js"; // <-- ajuste o path conforme seu projeto
import { answerFromFaq } from "@server/support/faqEngine";
import { SUPPORT_CONFIG } from "@server/support/faq";

const inputSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(800),
});

export const supportRouter = router({
  chat: publicProcedure.input(inputSchema).mutation(async ({ input }) => {
    const sessionId = input.sessionId ?? crypto.randomUUID();

    const { topic, score } = answerFromFaq(input.message);

    if (topic && score >= 1) {
      return {
        sessionId,
        answer: topic.answer,
        ctas: topic.ctas ?? [],
        topicId: topic.id,
      };
    }

    // fallback
    return {
      sessionId,
      answer:
        "Não consegui identificar exatamente o assunto. Você quer falar com o suporte no WhatsApp? Se preferir, me diga: entrega, pagamento, área atendida ou pedido.",
      ctas: [{ label: "Falar no WhatsApp", href: SUPPORT_CONFIG.whatsappUrl }],
      topicId: "unknown",
    };
  }),
});