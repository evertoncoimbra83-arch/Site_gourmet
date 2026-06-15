import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe, Mail, MessageCircle, MapPin, Instagram,
  Facebook, Loader2, ImageIcon, Camera, Sparkles
} from "lucide-react";
import { MediaLibraryDrawer } from "@/pages/adminMedia/view/MediaLibraryDrawer";
import { CompanyFormData, CompanySocialInfo } from "../logic/useCompanyInfo";
import { cn } from "@/lib/utils";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";

// --- INTERFACES ---
interface CompanyProps {
  state: {
    formData: CompanyFormData;
    isLoading: boolean;
  };
  actions: {
    updateSocial: (field: keyof CompanySocialInfo, value: string) => void;
    updateLogo: (url: string) => void;
  };
}

export function CompanyInfoForm({ state, actions }: CompanyProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  if (!state || !actions) return null;

  const { formData, isLoading } = state;

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-4xl border border-slate-100">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const social = formData?.companyInfo;

  // Utilitário para garantir preview correto da logo (Cloudinary vs Local)
  const getLogoPreview = (url: string | null | undefined) => {
    if (!url) return null;
    return resolveImageUrl(url, "logo");
  };

  return (
    <Card className="rounded-4xl border-none shadow-sm bg-white overflow-hidden border border-slate-100 text-left">
      <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100 text-left">
        <div className="flex items-center gap-3 text-emerald-600 text-left">
          <Globe size={24} />
          <div className="text-left">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 text-left">
              Identidade <span className="text-emerald-600">& Branding</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400 text-left">
              Logo, Redes Sociais e Contatos Oficiais
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8 text-left">
        {/* SELETOR DE LOGO PREMIUM */}
        <div className="space-y-4 text-left">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Sparkles size={12} className="text-emerald-500" /> Logomarca do Sistema
          </Label>

          <div
            onClick={() => setIsMediaOpen(true)}
            className={cn(
              "group relative h-40 w-full max-w-sm rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-slate-50",
              formData?.logoUrl ? "border-emerald-200 shadow-inner" : "border-slate-200 hover:border-emerald-500"
            )}
          >
            {formData?.logoUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-6">
                <img
                  src={resolveImageUrl(formData.logoUrl, "logo")}
                  className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                  alt="Logo Preview"
                  onError={(event) => {
                    event.currentTarget.src = getImageFallback("logo");
                  }}
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-xl">
                    <Camera size={14} className="text-emerald-600" />
                    <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Trocar Logo</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <ImageIcon size={32} className="mx-auto text-slate-200 group-hover:text-emerald-500 transition-colors" />
                <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-600">Selecionar da Biblioteca</p>
              </div>
            )}
          </div>
        </div>

        {/* CAMPOS DE CONTATO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 text-left">
          <div className="space-y-2 md:col-span-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
              <MapPin size={12} /> Endereço Completo
            </Label>
            <Input
              value={social?.address || ""}
              onChange={e => actions.updateSocial("address", e.target.value)}
              placeholder="Rua, Número, Bairro - Cidade/UF"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-left"
            />
          </div>

          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
              <MessageCircle size={12} /> WhatsApp de Atendimento
            </Label>
            <Input
              value={social?.whatsapp || ""}
              onChange={e => actions.updateSocial("whatsapp", e.target.value)}
              placeholder="(00) 00000-0000"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-left"
            />
          </div>

          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
              <Mail size={12} /> Email de Contato
            </Label>
            <Input
              value={social?.email || ""}
              onChange={e => actions.updateSocial("email", e.target.value)}
              placeholder="contato@empresa.com"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-left"
            />
          </div>

          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
              <Instagram size={12} /> Instagram
            </Label>
            <Input
              value={social?.instagram || ""}
              onChange={e => actions.updateSocial("instagram", e.target.value)}
              placeholder="@seu.perfil"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-left"
            />
          </div>

          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
              <Facebook size={12} /> Facebook
            </Label>
            <Input
              value={social?.facebook || ""}
              onChange={e => actions.updateSocial("facebook", e.target.value)}
              placeholder="fb.com/suapagina"
              className="h-12 rounded-xl bg-slate-50 border-none font-bold shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-left"
            />
          </div>
        </div>
      </CardContent>

      {/* ✅ Modal de Mídia integrado para escolher a logo */}
      <MediaLibraryDrawer
        open={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => {
          actions.updateLogo(url);
          setIsMediaOpen(false);
        }}
        initialFolder="logo"
      />
    </Card>
  );
}
