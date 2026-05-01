// server/support/faqEngine.ts
import { FAQ_TOPICS, type FaqTopic } from "./faq";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function answerFromFaq(message: string): { topic?: FaqTopic; score: number } {
  const text = normalize(message);
  if (!text) return { score: 0 };

  let best: { topic?: FaqTopic; score: number } = { score: 0 };

  for (const topic of FAQ_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      const nkw = normalize(kw);
      if (!nkw) continue;
      if (text.includes(nkw)) score += 1;
    }
    if (score > best.score) best = { topic, score };
  }

  return best;
}