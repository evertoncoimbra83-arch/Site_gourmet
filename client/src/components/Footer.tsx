// src/components/Footer.tsx

import React from "react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/_core/trpc";
import { safeJsonParse } from "@/lib/safe-parse";
import { 
  Instagram, 
  MessageCircle, 
  Mail, 
  Phone, 
  Loader2, 
  Star,
  Users // ✅ Importado para a seção de parceiros
} from "lucide-react";
import { Link } from "react-router-dom"; 

// --- INTERFACES ---
interface CompanySocialInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  instagram?: string;
}

interface PublicSettingsResponse {
  company_social_info?: string | CompanySocialInfo;
  [key: string]: unknown;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const { data: settings, isLoading } = trpc.public.getPublicSettings.useQuery();

  const getCompanyData = (): CompanySocialInfo => {
    const raw = (settings as unknown as PublicSettingsResponse)?.company_social_info;
    if (!raw) return {};
    return safeJsonParse<CompanySocialInfo>(raw, {});
  };

  const company = getCompanyData();

  const contact = {
    phone: company.phone || "(11) 4526-5941",
    whatsapp: company.whatsapp || "551145265941",
    email: company.email || "contato@gourmetsaudavel.com",
    address: company.address || "Jundiaí - SP",
    instagram: company.instagram?.replace('@', '') || "gourmetsaudavel",
  };

  return (
    <footer className="bg-slate-900 text-white mt-20 relative rounded-t-[3rem] md:rounded-t-[5rem] overflow-hidden text-left">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 mb-12">
          
          {/* BRAND & STORY */}
          <div className="space-y-6 md:col-span-1">
            <div className="leading-none">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                Gourmet <span className="text-emerald-500">Saudável</span>
              </h3>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase leading-relaxed tracking-tight">
              Saúde e sabor em cada prato. <br />
              Comida de verdade, natural e feita do seu jeito.
            </p>
            {isLoading && (
              <div className="flex items-center gap-2 opacity-30">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">Sincronizando...</span>
              </div>
            )}
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-emerald-500">Navegação</h4>
            <ul className="space-y-3 text-[11px] font-black uppercase tracking-widest text-slate-300">
              <li><Link to="/" className="hover:text-emerald-500 transition-colors">Início</Link></li>
              <li><Link to="/produtos" className="hover:text-emerald-500 transition-colors">Cardápio</Link></li>
              <li><Link to="/pacotes" className="hover:text-emerald-500 transition-colors">Pacotes</Link></li>
            </ul>
          </div>

          {/* ✅ NOVA SEÇÃO: PARCEIROS & BENEFÍCIOS */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-emerald-500">Parceiros</h4>
            <ul className="space-y-3 text-[11px] font-black uppercase tracking-widest text-slate-300">
               <li>
                <Link to="/fidelidade" className="hover:text-emerald-500 transition-colors flex items-center gap-2">
                   Fidelidade <Star size={10} className="fill-emerald-500 text-emerald-500" />
                </Link>
              </li>
              <li>
                <Link to="/nutri/cadastro" className="hover:text-emerald-500 transition-colors flex items-center gap-2">
                  Seja um Nutri Parceiro <Users size={10} className="text-emerald-500" />
                </Link>
              </li>
            </ul>
          </div>

          {/* ATENDIMENTO */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-emerald-500">Atendimento</h4>
            <ul className="space-y-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>{contact.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span className="truncate">{contact.email}</span>
              </li>
            </ul>
          </div>

          {/* REDES SOCIAIS */}
          <div className="space-y-6">
            <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-emerald-500">Social</h4>
            <div className="flex gap-4">
              <a 
                href={`https://instagram.com/${contact.instagram}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-3 bg-white/5 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-3 bg-white/5 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/5 pt-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center md:text-left">
              <p>&copy; {currentYear} {APP_TITLE}.</p>
              <p className="mt-1 opacity-50 uppercase tracking-tighter">Natural por essência, feita do seu jeito.</p>
            </div>
            
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-widest text-slate-500">
              <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
              <Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
