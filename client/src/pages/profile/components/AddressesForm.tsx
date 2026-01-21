import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, MapPin } from "lucide-react";

// Esquema de validação com Zod
const addressSchema = z.object({
  label: z.string().min(1, "Dê um nome ao local (ex: Casa, Trabalho)"),
  zipCode: z.string().min(8, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  complement: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => Promise<void>;
  isLoading: boolean;
}

export function AddressForm({ onSubmit, isLoading }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  // Função para buscar CEP (Opcional, mas melhora muito a experiência)
  const checkCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue("street", data.logradouro);
        setValue("neighborhood", data.bairro);
        setValue("city", data.localidade);
        setValue("state", data.uf);
      }
    } catch (err) {
      console.error("Erro ao buscar CEP");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Nome do Local */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Identificação (ex: Casa do João)</label>
          <Input 
            {...register("label")} 
            placeholder="Ex: Minha Casa"
            className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
          />
          {errors.label && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.label.message}</p>}
        </div>

        {/* CEP e Rua */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">CEP</label>
          <Input 
            {...register("zipCode")} 
            onBlur={checkCEP}
            placeholder="00000-000"
            className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
          />
          {errors.zipCode && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.zipCode.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Rua / Logradouro</label>
          <Input 
            {...register("street")} 
            placeholder="Nome da rua"
            className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
          />
          {errors.street && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.street.message}</p>}
        </div>

        {/* Número e Complemento */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Número</label>
          <Input 
            {...register("number")} 
            placeholder="123"
            className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
          />
          {errors.number && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.number.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Complemento</label>
          <Input 
            {...register("complement")} 
            placeholder="Apto, Bloco, etc."
            className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
          />
        </div>

        {/* Bairro, Cidade e UF */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Bairro</label>
          <Input 
            {...register("neighborhood")} 
            className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
          />
          {errors.neighborhood && <p className="text-red-500 text-[10px] font-bold uppercase ml-2">{errors.neighborhood.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cidade</label>
            <Input 
              {...register("city")} 
              className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">UF</label>
            <Input 
              {...register("state")} 
              placeholder="SP"
              maxLength={2}
              className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-center uppercase focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black uppercase text-[12px] tracking-[0.2em] h-14 shadow-xl shadow-slate-200"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Endereço
          </div>
        )}
      </Button>
    </form>
  );
}