// e:/IA/projects/Site_React/client/src/pages/nutri/logic/useRegisterNutri.ts

import { useState, useCallback } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES LOCAIS ---
export interface NutriAddress {
  label: string;
  zipCode: string; // ✅ Padronizado para zipCode
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
  isDefault: boolean; // ✅ Padronizado para camelCase
}

export interface NutriFormData {
  name: string;
  email: string;
  password?: string;
  document: string;
  phone: string;
  crn: string;
  specialty: string;
  bio: string;
  offices: NutriAddress[];
}

export function useRegisterNutri() {
  const [step, setStep] = useState<number>(1);
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  
  const [formData, setFormData] = useState<NutriFormData>({
    name: "",
    email: "",
    password: "",
    document: "",
    phone: "",
    crn: "",
    specialty: "",
    bio: "",
    offices: [{ 
      label: "Consultório Principal", 
      zipCode: "", 
      street: "", 
      number: "", 
      neighborhood: "", 
      city: "", 
      state: "",
      complement: "",
      isDefault: true 
    }]
  });

  // ✅ Rota tRPC com tratamento de erro tipado
  const registerMutation = trpc.nutri.registerPublicProfile.useMutation({ 
    onSuccess: () => {
      setStep(3);
      toast.success("Cadastro realizado com sucesso!");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Erro ao realizar cadastro");
    }
  });

  const updateField = useCallback(<K extends keyof NutriFormData>(field: K, value: NutriFormData[K]) => {
    setFormData((prev: NutriFormData) => ({ ...prev, [field]: value }));
  }, []);

  const updateOfficeField = useCallback((index: number, field: keyof NutriAddress, value: string | boolean) => {
    setFormData((prev: NutriFormData) => {
      const newOffices = [...prev.offices];
      // ✅ Atualização de campo tipada sem any
      newOffices[index] = { ...newOffices[index], [field]: value } as NutriAddress;
      return { ...prev, offices: newOffices };
    });
  }, []);

  const searchZipCode = async (index: number, zip: string) => {
    const cleanZip = zip.replace(/\D/g, "");
    if (cleanZip.length !== 8) return;

    setIsSearchingZip(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado.");
      } else {
        updateOfficeField(index, "street", data.logradouro || "");
        updateOfficeField(index, "neighborhood", data.bairro || "");
        updateOfficeField(index, "city", data.localidade || "");
        updateOfficeField(index, "state", data.uf || "");
      }
    } catch {
      toast.error("Erro ao buscar endereço.");
    } finally {
      setIsSearchingZip(false);
    }
  };

  const addOffice = () => {
    setFormData((prev: NutriFormData) => ({
      ...prev,
      offices: [...prev.offices, { 
        label: `Consultório ${prev.offices.length + 1}`, 
        zipCode: "", 
        street: "", 
        number: "", 
        neighborhood: "", 
        city: "", 
        state: "", 
        complement: "", 
        isDefault: false 
      }]
    }));
  };

  const removeOffice = (index: number) => {
    setFormData((prev: NutriFormData) => {
      if (prev.offices.length === 1) return prev;
      return {
        ...prev,
        offices: prev.offices.filter((_, i: number) => i !== index)
      };
    });
  };

  const handleSubmit = () => {
    if (!formData.email || !formData.password) {
      return toast.error("E-mail e senha são obrigatórios");
    }
    if (!formData.crn) {
      return toast.error("CRN é obrigatório");
    }

    // ✅ Payload limpo e padronizado
    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      document: formData.document,
      phone: formData.phone,
      crn: formData.crn,
      specialty: formData.specialty,
      bio: formData.bio,
      offices: formData.offices.map((o: NutriAddress) => ({
        label: o.label,
        zipCode: o.zipCode,
        street: o.street,
        number: o.number,
        neighborhood: o.neighborhood,
        city: o.city,
        state: o.state,
        complement: o.complement,
        isDefault: o.isDefault
      }))
    });
  };

  return {
    step,
    formData,
    isSearchingZip,
    isPending: registerMutation.isPending,
    nextStep: () => setStep(s => s + 1),
    prevStep: () => setStep(s => s - 1),
    handleSubmit,
    updateField,
    updateOfficeField,
    searchZipCode,
    addOffice,
    removeOffice,
    setFormData
  };
}