// client/src/pages/adminSettings/components/tabs/StoreTab.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe, Mail, MessageCircle, MapPin, Instagram,
  Facebook, Loader2, ImageIcon, Camera, Sparkles
} from "lucide-react";
import { MediaLibraryDrawer } from "@/pages/adminMedia/view/MediaLibraryDrawer";
import { CompanyFormData, CompanySocialInfo } from "../../logic/useCompanyInfo";
import { AreaShell } from "../AreaShell";
import { settingsAreas } from "../../config/settingsAreas";
import { cn } from "@/lib/utils";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";

const area = settingsAreas[0];

// Interface limpa e estrita, substituindo o ComponentProps antigo
interface StoreTabProps {
  companyTab: {
    state: {
      formData: CompanyFormData;
      isLoading: boolean;
    };
    actions: {
      updateSocial: (field: keyof CompanySocialInfo, value: string) => void;
      updateLogo: (url: string) => void;
    };
  };
}

export function StoreTab({ companyTab }: StoreTabProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const { formData, isLoading } = companyTab.state;
  const { updateSocial, updateLogo } = companyTab.actions;

  const social = formData?.companyInfo;

  // Utilitário para garantir preview correto da logo (Cloudinary vs Local)
  const getLogoPreview = (url: string | null | undefined) => {
    if (!url) return null;
    return resolveImageUrl(url, "logo");
  };

  if (isLoading) {
    return (
      <AreaShell area={area}>
        <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-slate-200 shadow-sm w-full min-w-0">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      </AreaShell>
    );
  }

  return (
    <AreaShell area={area}>
      <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-xs bg-white overflow-hidden w-full min-w-0 text-left animate-in fade-in duration-500">
        <CardHeader className="p-5 sm:p-8 bg-slate-50/50 border-b border-slate-100 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-emerald-600 text-left">
            <div className="bg-emerald-100/50 p-2.5 rounded-xl shrink-0">
               <Globe size={22} className="text-emerald-700" />
            </div>
            <div className="text-left w-full min-w-0">
              <CardTitle className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-slate-900 text-left">
                Identidade <span className="text-emerald-600">& Branding</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left mt-0.5 leading-snug">
                Logo, Redes Sociais e Contatos Oficiais da Loja
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-8 space-y-8 text-left w-full min-w-0">

          {/* SELETOR DE LOGO PREMIUM */}
          <div className="space-y-4 text-left w-full">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Sparkles size={12} className="text-emerald-500" /> Logomarca do Sistema
            </Label>

            <div
              onClick={() => setIsMediaOpen(true)}
              className={cn(
                "group relative h-40 w-full sm:max-w-sm rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-slate-50/50",
                formData?.logoUrl ? "border-emerald-200 shadow-inner bg-white" : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20"
              )}
            >
              {formData?.logoUrl ? (
                <div className="relative w-full h-full flex items-center justify-center p-6">
                  <img
                    src={resolveImageUrl(formData.logoUrl, "logo")}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    alt="Logo Preview"
                    onError={(event) => {
                      event.currentTarget.src = getImageFallback("logo");
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                      <Camera size={14} className="text-emerald-600" />
                      <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Trocar Logo</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon size={28} className="mx-auto text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600">
                    Selecionar da Biblioteca
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CAMPOS DE CONTATO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-6 border-t border-slate-100 text-left w-full min-w-0">
            <div className="space-y-1.5 md:col-span-2 text-left w-full min-w-0">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
                <MapPin size={12} className="text-slate-300" /> Endereço Completo
              </Label>
              <Input
                value={social?.address || ""}
                onChange={e => updateSocial("address", e.target.value)}
                placeholder="Rua, Número, Bairro - Cidade/UF"
                className="h-11 sm:h-12 rounded-xl bg-slate-50/70 border border-slate-100 font-bold text-xs shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 w-full"
              />
            </div>

            <div className="space-y-1.5 text-left w-full min-w-0">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
                <MessageCircle size={12} className="text-emerald-500" /> WhatsApp Oficial
              </Label>
              <Input
                value={social?.whatsapp || ""}
                onChange={e => updateSocial("whatsapp", e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-11 sm:h-12 rounded-xl bg-slate-50/70 border border-slate-100 font-bold text-xs shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 w-full"
              />
            </div>

            <div className="space-y-1.5 text-left w-full min-w-0">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
                <Mail size={12} className="text-slate-300" /> Email de Contato
              </Label>
              <Input
                value={social?.email || ""}
                onChange={e => updateSocial("email", e.target.value)}
                placeholder="contato@empresa.com"
                className="h-11 sm:h-12 rounded-xl bg-slate-50/70 border border-slate-100 font-bold text-xs shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 w-full"
              />
            </div>

            <div className="space-y-1.5 text-left w-full min-w-0">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
                <Instagram size={12} className="text-pink-500" /> Instagram
              </Label>
              <Input
                value={social?.instagram || ""}
                onChange={e => updateSocial("instagram", e.target.value)}
                placeholder="@seu.perfil"
                className="h-11 sm:h-12 rounded-xl bg-slate-50/70 border border-slate-100 font-bold text-xs shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 w-full"
              />
            </div>

            <div className="space-y-1.5 text-left w-full min-w-0">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 text-left">
                <Facebook size={12} className="text-blue-500" /> Facebook
              </Label>
              <Input
                value={social?.facebook || ""}
                onChange={e => updateSocial("facebook", e.target.value)}
                placeholder="fb.com/suapagina"
                className="h-11 sm:h-12 rounded-xl bg-slate-50/70 border border-slate-100 font-bold text-xs shadow-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-800 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <MediaLibraryDrawer
        open={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={(url) => {
          updateLogo(url);
          setIsMediaOpen(false);
        }}
        initialFolder="logo"
      />
    </AreaShell>
  );
}
