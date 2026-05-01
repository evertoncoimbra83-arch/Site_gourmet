import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/safe-parse";
import { trpc } from "@/_core/trpc";

interface ChatCTA {
  label: string;
  href: string;
}

interface ChatResponse {
  sessionId: string;
  answer: string;
  ctas?: ChatCTA[];
}

type Msg = {
  role: "user" | "bot";
  text: string;
};

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("support_session")
  );
  
  const [messages, setMessages] = useState<Msg[]>(() => {
    const stored = localStorage.getItem("support_messages");
    return safeJsonParse<Msg[]>(stored, []);
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Ajustado para o path padrão observado no seu AppRouter (store.support)
  const chatMutation = trpc.store.support.chat.useMutation();

  useEffect(() => {
    localStorage.setItem("support_messages", JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("support_session", sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, open]);

  async function sendMessage() {
    if (!text.trim() || chatMutation.isPending) return;

    const userMessage = text.trim();
    setText("");

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    try {
      // ✅ Tipagem do resultado da mutation
      const res = await chatMutation.mutateAsync({
        sessionId: sessionId ?? undefined,
        message: userMessage,
      }) as ChatResponse;

      setSessionId(res.sessionId);

      // Adiciona a resposta principal
      setMessages((prev) => [...prev, { role: "bot", text: res.answer }]);

      // ✅ Processamento de CTAs (Links de ação) tipado
      if (res.ctas && res.ctas.length > 0) {
        res.ctas.forEach((cta) => {
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: `${cta.label}: ${cta.href}` },
          ]);
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Ocorreu um erro ao processar sua mensagem. Tente novamente." },
      ]);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <Button
          className="rounded-full h-14 w-14 p-0 shadow-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <Card className="w-90 max-w-[92vw] shadow-2xl border-emerald-100 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-bold text-sm uppercase tracking-widest">Suporte IA</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 bg-white">
            <div className="h-85 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  Olá! 👋 Sou o assistente da <b>Gourmet Saudável</b>. <br /><br />
                  Posso te ajudar com dúvidas sobre <b>entrega</b>, <b>pagamentos</b>, 
                  <b> área de cobertura</b> ou o status do seu <b>pedido</b>.
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-sm whitespace-pre-wrap rounded-2xl px-4 py-2.5 shadow-sm",
                    msg.role === "user"
                      ? "bg-emerald-600 text-white ml-8 rounded-tr-none"
                      : "bg-slate-100 text-slate-800 mr-8 rounded-tl-none border border-slate-200"
                  )}
                >
                  {renderWithLinks(msg.text)}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="bg-slate-100 text-slate-400 text-xs rounded-2xl px-4 py-2 mr-8 inline-flex items-center gap-2 border border-slate-200">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analisando...
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva sua dúvida..."
                className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!text.trim() || chatMutation.isPending}
                className="rounded-xl bg-slate-900 hover:bg-emerald-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 text-[10px] text-center text-slate-400 font-medium uppercase tracking-tighter">
              Horário: 08:00–14:00 • Entrega: 24h a 48h úteis
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function renderWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part, i) =>
    part.startsWith("http") ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-inherit underline font-bold hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
