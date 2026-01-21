import React from "react";
import { format } from "date-fns";

/**
 * 🛠️ Helper para parsear o JSON das opções
 */
function robustParse(val: any): any {
  if (!val || val === "null" || val === "undefined") return null;
  if (typeof val === 'object') return val;
  try {
    let sanitized = String(val).trim();
    if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
      sanitized = sanitized.substring(1, sanitized.length - 1);
    }
    sanitized = sanitized.replace(/\\"/g, '"');
    return JSON.parse(sanitized);
  } catch { 
    return null; 
  }
}

export const OrderLabelsTemplate = React.forwardRef(({ order, singleItem }: any, ref: any) => {
  if (!order || !singleItem) return null;

  // 1. Parse das opções/acompanhamentos
  const options = robustParse(singleItem.options || singleItem.accompaniments);
  
  // 2. Lógica para Identificar o Nome (Se for Kit, pega o prato específico se disponível)
  // No caso de impressão individual de itens de um kit, o 'singleItem' geralmente 
  // já é a marmita específica ou o pacote todo.
  const isPkg = options?._type === 'multi' || !!options?.meals;
  
  // Nome Principal para a Etiqueta
  const displayName = options?.dishName || options?.packageName || singleItem.dishName || singleItem.name;
  
  // Acompanhamentos
  const accompaniments = options?.selectedAccompaniments || [];

  // Ingredientes (Pega do prato ou do fallback)
  const ingredients = singleItem.dish?.ingredients || 
                      singleItem.ingredients || 
                      "Consulte os ingredientes no verso ou site.";

  return (
    <div ref={ref} style={{ 
      width: '100mm', 
      height: '150mm', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <style>{`
        @media print {
          @page { size: 100mm 150mm; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div style={{ 
        width: '100%', 
        height: '100%', 
        padding: '10mm', 
        border: '8px solid black', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        {/* CABEÇALHO: CLIENTE E ID AMIGÁVEL GS- */}
        <div style={{ borderBottom: '5px solid black', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>CLIENTE:</span>
             <span style={{ fontSize: '14px', fontWeight: '900' }}>PEDIDO</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, textTransform: 'uppercase', lineHeight: '1.1', maxWidth: '65%' }}>
              {order.customerName}
            </h1>
            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>{order.id}</h2>
          </div>
        </div>

        {/* CORPO: NOME DO PRATO (DESTAQUE MÁXIMO) */}
        <div style={{ flex: 1, paddingTop: '15px' }}>
          <div style={{ backgroundColor: 'black', color: 'white', padding: '10px', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0, textTransform: 'uppercase', textAlign: 'center', lineHeight: '1.2' }}>
              {displayName}
            </h3>
          </div>

          {/* LISTA DE ACOMPANHAMENTOS ESPECÍFICOS */}
          {accompaniments.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {accompaniments.map((acc: any, i: number) => (
                <div key={i} style={{ 
                  fontSize: '18px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase', 
                  borderLeft: '8px solid black', 
                  paddingLeft: '10px', 
                  marginBottom: '6px',
                  lineHeight: '1.1' 
                }}>
                  {acc.name}
                </div>
              ))}
            </div>
          )}

          {/* SE FOR PACOTE E TIVER MARMITAS (Exibir resumo se necessário) */}
          {isPkg && accompaniments.length === 0 && (
            <div style={{ fontSize: '14px', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center', padding: '10px', border: '1px dashed black' }}>
              Consulte os itens deste kit no ticket de produção.
            </div>
          )}
        </div>

        {/* INFORMAÇÕES TÉCNICAS E NUTRICIONAIS */}
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', textDecoration: 'underline' }}>COMPOSIÇÃO / INGREDIENTES:</span>
          <p style={{ fontSize: '11px', lineHeight: '1.2', textAlign: 'justify', margin: '4px 0 0 0', fontWeight: '500' }}>
            {ingredients}
          </p>
        </div>

        {/* RODAPÉ: VALIDADE E CONSERVAÇÃO */}
        <div style={{ borderTop: '5px solid black', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 'bold', display: 'block' }}>DATA PRODUÇÃO</span>
              <span style={{ fontSize: '20px', fontWeight: '900' }}>{format(new Date(), 'dd/MM/yyyy')}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
               <span style={{ fontSize: '10px', fontWeight: 'bold', display: 'block' }}>VALIDADE (CONG.)</span>
               <span style={{ fontSize: '20px', fontWeight: '900' }}>90 DIAS</span>
            </div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '11px', 
            fontWeight: '900', 
            backgroundColor: 'black', 
            color: 'white', 
            padding: '4px',
            marginTop: '5px',
            letterSpacing: '1px'
          }}>
            GOURMET SAUDÁVEL • MANTENHA CONGELADO
          </div>
        </div>

      </div>
    </div>
  );
});