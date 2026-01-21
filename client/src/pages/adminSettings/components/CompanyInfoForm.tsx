import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Globe, Mail, MessageCircle, Phone, Loader2, Instagram, Facebook, MapPin } from "lucide-react";
// ✅ Caminho corrigido conforme seu uso
import ImagePicker from "../../adminDishes/components/ImagePicker"; 

export function CompanyInfoForm() {
  const [formData, setFormData] = useState({
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    instagram: "",
    facebook: "",
    logoUrl: "" 
  });

  const utils = trpc.useUtils();
  const { data: currentConfigs, isLoading: isFetching } = trpc.admin.storeSettings.get.useQuery();

  useEffect(() => {
    const info = (currentConfigs as any)?.companyInfo;
    if (info) setFormData(info);
  }, [currentConfigs]);

  // ✨ Máscara de Telefone Inteligente (Fixo e Celular)
  const maskPhone = (value: string) => {
    const n = value.replace(/\D/g, "");
    if (n.length <= 10) {
      return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").substring(0, 14);
    }
    return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
  };

  const mutation = trpc.admin.storeSettings.saveCompanyInfo.useMutation({
    onSuccess: () => {
      toast.success("Identidade e Contatos salvos com sucesso!");
      utils.admin.storeSettings.get.invalidate();
      (utils as any).public?.getCompanyInfo?.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`)
  });

  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-100">
      <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-3 text-primary">
          <Globe size={24} />
          <div>
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
              Identidade <span className="text-primary">& Branding</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400">
              Logo, Endereço e Redes Sociais
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {isFetching ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
          <>
            {/* 🖼️ LOGOMARCA */}
            <div className="max-w-md">
              <ImagePicker 
                label="Logomarca do Sistema"
                value={formData.logoUrl}
                onChange={(url) => setFormData({ ...formData, logoUrl: url })}
              />
              <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-2 ml-1">
                Sugestão: SVG ou PNG transparente (128x128px)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              
              {/* TELEFONES */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Phone size={12}/> Telefone Fixo
                </Label>
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <MessageCircle size={12}/> WhatsApp
                </Label>
                <Input 
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: maskPhone(e.target.value)})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* REDES SOCIAIS */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Instagram size={12}/> Instagram
                </Label>
                <Input 
                  value={formData.instagram}
                  onChange={e => setFormData({...formData, instagram: e.target.value.replace('@', '')})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="usuario (sem @)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Facebook size={12}/> Facebook
                </Label>
                <Input 
                  value={formData.facebook}
                  onChange={e => setFormData({...formData, facebook: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="nome.da.pagina"
                />
              </div>

              {/* EMAIL E ENDEREÇO */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <Mail size={12}/> E-mail de Contato
                </Label>
                <Input 
                  value={formData.email}
                  type="email"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <MapPin size={12}/> Endereço Completo
                </Label>
                <Input 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                />
              </div>
            </div>

            <Button 
              onClick={() => mutation.mutate(formData)} 
              disabled={mutation.isPending}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
            >
              {mutation.isPending ? <Loader2 className="animate-spin" /> : "SALVAR IDENTIDADE VISUAL"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}