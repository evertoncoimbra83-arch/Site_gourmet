// server/utils/label-compiler.ts

// 1. Tipagem rigorosa para os elementos da etiqueta
export interface LabelElement {
  type: 'text' | 'barcode' | 'line';
  x: number;
  y: number;
  fontSize?: number;
  field?: 'dishName' | 'customerName' | 'kcal' | 'carbs' | 'prots' | 'fats' | 'orderId' | 'itemIndex' | 'totalItems' | 'ingredients'; 
  staticText?: string;
  height?: number; 
  width?: number;  
}

// 2. Tipagem para os dados que alimentam a etiqueta
export interface LabelData {
  dishName: string;
  customerName: string;
  ingredients: string;
  kcal: string | number;
  carbs: string | number;
  prots: string | number;
  fats: string | number;
  orderId: string;
  itemIndex: number | string;
  totalItems: number | string;
  [key: string]: string | number; // Fallback seguro
}

export function compileToZPL(elementsJson: string, data: LabelData): string {
  // Fazemos o parse e garantimos que o TS trate como um array de elementos
  const elements = JSON.parse(elementsJson) as LabelElement[];
  let zpl = "^XA^CI28"; 

  elements.forEach((el) => {
    // Busca o valor no objeto data usando o campo definido ou usa o texto estático
    const rawValue = el.field ? data[el.field] : el.staticText;
    const content = String(rawValue || "");
    
    // Fator de conversão (Zebra TLP 2844 em 203 DPI): 
    // Se o editor usar mm, multiplicamos por 8. Se usar dots, mantemos 1.
    const multiplier = 8; 

    switch (el.type) {
      case "text":
        zpl += `^FO${el.x * multiplier},${el.y * multiplier}^CF0,${el.fontSize || 20}^FD${content}^FS`;
        break;
      case "barcode":
        zpl += `^FO${el.x * multiplier},${el.y * multiplier}^BY2^BCN,${el.height || 60},Y,N,N^FD${content}^FS`;
        break;
      case "line":
        zpl += `^FO${el.x * multiplier},${el.y * multiplier}^GB${(el.width || 10) * multiplier},${(el.height || 1) * multiplier},1^FS`;
        break;
    }
  });

  zpl += "^XZ";
  return zpl;
}