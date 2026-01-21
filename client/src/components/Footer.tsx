import { APP_TITLE } from "@/const";
import { trpc } from "@/_core/trpc";
import { Facebook, Instagram, MessageCircle, Mail, MapPin, Phone, Loader2, AlertCircle } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // 1. Busca as informações com tratamento de erro explícito
  const { data: info, isLoading, error, isError } = (trpc.public as any).getCompanyInfo.useQuery(undefined, {
    retry: false, // Facilita o debug não tentando mil vezes
    onError: (err: any) => console.error("❌ Erro no tRPC Footer:", err)
  });

  const contact = {
    phone: info?.phone || "(11) 99999-9999",
    whatsapp: info?.whatsapp || "5511999999999",
    email: info?.email || "contato@gourmetsaudavel.com.br",
    address: info?.address || "São Paulo, SP",
    instagram: info?.instagram || "gourmetsaudavel",
    facebook: info?.facebook || "gourmetsaudavel"
  };

  return (
    <footer className="bg-primary text-primary-foreground mt-20 relative">
      
       {(isError || (!isLoading && !info)) && (
        <div className="bg-red-900/90 text-white p-4 text-[10px] font-mono border-b border-red-500">
          <div className="container flex items-center gap-4">
            <AlertCircle size={16} className="text-red-300 animate-pulse" />
            <div>
              <p className="font-bold uppercase tracking-widest">Diagnóstico de Layout:</p>
              <p>Status: {isError ? "Erro de Rede/404" : "Conectado mas Sem Dados"}</p>
              <p>Mensagem: {error?.message || "Nenhuma config encontrada no banco"}</p>
              <p>Endpoint: public.getCompanyInfo</p>
            </div>
          </div>
        </div>
      )}

      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-bold tracking-tight">{APP_TITLE}</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed italic">
              Saúde e sabor em cada marmita.
            </p>
            {isLoading && (
              <div className="flex items-center gap-2 opacity-30">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Sincronizando...</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black mb-4 uppercase text-[10px] tracking-[0.2em] text-secondary">Links Rápidos</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="/" className="hover:text-secondary transition-colors">Início</a></li>
              <li><a href="/produtos" className="hover:text-secondary transition-colors">Produtos</a></li>
              <li><a href="/contato" className="hover:text-secondary transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Contact Info Dinâmico */}
          <div>
            <h4 className="font-black mb-4 uppercase text-[10px] tracking-[0.2em] text-secondary">Atendimento</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-foreground/10 rounded-md"><Phone className="w-3 h-3" /></div>
                <span className="font-bold">{contact.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-foreground/10 rounded-md"><Mail className="w-3 h-3" /></div>
                <span className="font-bold truncate max-w-[150px]">{contact.email}</span>
              </li>
            </ul>
          </div>

          {/* Social Media Dinâmico */}
          <div>
            <h4 className="font-black mb-4 uppercase text-[10px] tracking-[0.2em] text-secondary">Redes Sociais</h4>
            <div className="flex gap-3">
              <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`} target="_blank" className="p-3 bg-primary-foreground/10 rounded-2xl hover:bg-secondary hover:text-secondary-foreground transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" className="p-3 bg-[#25D366]/20 text-[#25D366] rounded-2xl hover:bg-[#25D366] hover:text-white transition-all">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/40">
            <p>&copy; {currentYear} {APP_TITLE}.</p>
            <div className="flex gap-6 text-[9px]">
              <p>Debug Mode: ON</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}