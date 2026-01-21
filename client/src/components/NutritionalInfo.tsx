import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Leaf } from "lucide-react";

interface NutritionalValue {
  value: string;
  dv: string;
}

interface NutritionalData {
  energy?: NutritionalValue;
  carbs?: NutritionalValue;
  protein?: NutritionalValue;
  fat_total?: NutritionalValue;
  fat_saturated?: NutritionalValue;
  fat_trans?: NutritionalValue;
  fiber?: NutritionalValue;
  sodium?: NutritionalValue;
}

interface NutritionalInfoProps {
  // CORREÇÃO: Permitir 'any' para flexibilidade com o retorno do DB
  info: NutritionalData | string | null | any;
}

export function NutritionalInfo({ info }: NutritionalInfoProps) {
  if (!info) return null;

  let data: NutritionalData;
  try {
    if (typeof info === 'string') {
      data = JSON.parse(info);
    } else {
      data = info as NutritionalData;
    }
  } catch (e) {
    return null;
  }

  if (!data || Object.keys(data).length === 0) return null;

  const labels: Record<string, string> = {
    energy: "Valor Energético",
    carbs: "Carboidratos",
    protein: "Proteínas",
    fat_total: "Gorduras Totais",
    fat_saturated: "Gorduras Saturadas",
    fat_trans: "Gorduras Trans",
    fiber: "Fibra Alimentar",
    sodium: "Sódio",
  };

  const isEmpty = (val?: NutritionalValue) => !val?.value && !val?.dv;

  return (
    <Accordion type="single" collapsible className="w-full border rounded-lg bg-white shadow-sm my-4">
      <AccordionItem value="nutrition" className="border-b-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 rounded-lg text-[#2D5A3D]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Leaf className="w-4 h-4" />
            Informação Nutricional
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-0">
          <div className="text-xs text-gray-500 mb-2 pt-2">Porção do prato inteiro</div>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2 text-right">%VD*</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(labels).map(([key, label]) => {
                  const item = data[key as keyof NutritionalData];
                  if (isEmpty(item)) return null;

                  return (
                    <tr key={key}>
                      <td className="px-3 py-1.5 text-gray-700">{label}</td>
                      <td className="px-3 py-1.5 text-right font-medium text-gray-900">{item?.value}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500 text-xs">{item?.dv ? `${item.dv}%` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}