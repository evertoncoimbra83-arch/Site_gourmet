import React from "react";

/**
 * 🛠️ Função de parse robusta para lidar com JSON string ou objeto
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

export default function OrderPrintTemplate({ order, id }: { order: any; id?: string }) {
  if (!order) return null;

  const money = (val: any) => 
    new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(Number(val || 0));

  return (
    <div 
      id={id} 
      className="thermal-print"
      style={{ 
        backgroundColor: 'white', 
        color: 'black', 
        width: '72mm', // Ajustado para padrão comum de 80mm (com margens)
        padding: '5px', 
        fontFamily: 'monospace',
        lineHeight: '1.2',
        fontSize: '12px'
      }}
    >
      <style>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden; }
          .thermal-print, .thermal-print * { visibility: visible !important; }
          .thermal-print { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            display: block !important;
          }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '5px', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '18px', margin: '0', textTransform: 'uppercase', fontWeight: 'bold' }}>Gourmet Saudável</h1>
        <p style={{ fontSize: '10px', margin: '0' }}>Alimentação Inteligente</p>
      </div>

      {/* INFO CLIENTE */}
      <div style={{ fontSize: '11px', marginBottom: '10px', borderBottom: '1px dashed black', paddingBottom: '5px' }}>
        <p><strong>PEDIDO:</strong> {order.id}</p>
        <p><strong>DATA:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : ""}</p>
        <p><strong>CLIENTE:</strong> {order.customerName}</p>
        {order.customerPhone && <p><strong>FONE:</strong> {order.customerPhone}</p>}
        <p style={{ marginTop: '5px' }}>
          <strong>ENTREGA:</strong> {order.shippingAddress || order.address}, {order.shippingAddressNumber || order.addressNumber}
          {order.shippingNeighborhood && ` - ${order.shippingNeighborhood}`}
        </p>
      </div>

      {/* LISTA DE ITENS */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid black' }}>Itens da Produção</p>
        
        {order.items?.map((item: any, idx: number) => {
          // ✅ Prioridade absoluta para o campo 'options' (JSON)
          const options = robustParse(item.options || item.accompaniments);
          
          const isPkg = options?._type === 'multi' || !!options?.meals;
          const displayName = options?.packageName || options?.dishName || item.dishName || item.name;
          const displaySize = options?.selectedSize?.name || item.sizeName;
          const accompaniments = options?.selectedAccompaniments || [];
          const meals = options?.meals || [];

          return (
            <div key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span style={{ flex: 1 }}>
                  {item.quantity}x {displayName}
                  {displaySize && ` (${displaySize})`}
                </span>
                <span style={{ marginLeft: '5px' }}>{money(Number(item.totalPrice || 0))}</span>
              </div>
              
              <div style={{ paddingLeft: '5px', marginTop: '4px' }}>
                {isPkg ? (
                  // ✅ Render para Pacotes (Kits de Marmitas)
                  meals.map((meal: any, mIdx: number) => (
                    <div key={mIdx} style={{ marginBottom: '4px', borderLeft: '2px solid #ccc', paddingLeft: '5px' }}>
                      <p style={{ fontSize: '10px', margin: '0', fontWeight: 'bold', color: '#333' }}>
                        {meal.slotName}: {meal.dishName}
                      </p>
                      {meal.selectedAccompaniments?.map((acc: any, aIdx: number) => (
                        <p key={aIdx} style={{ fontSize: '9px', margin: '0', color: '#666' }}>
                          + {acc.name}
                        </p>
                      ))}
                    </div>
                  ))
                ) : (
                  // ✅ Render para Pratos Avulsos
                  accompaniments.map((opt: any, oIdx: number) => (
                    <p key={oIdx} style={{ fontSize: '10px', margin: '0' }}>
                      <span style={{ fontWeight: 'bold' }}>{opt.groupName || "Acomp"}:</span> {opt.name}
                    </p>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TOTAIS */}
      <div style={{ borderTop: '2px solid black', paddingTop: '5px', textAlign: 'right', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>SUBTOTAL:</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>DESCONTOS:</span>
          <span>- {money(order.totalDiscount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>TAXA ENTREGA:</span>
          <span>{Number(order.shippingCost) > 0 ? money(order.shippingCost) : "GRÁTIS"}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '5px', borderTop: '1px solid black', paddingTop: '3px' }}>
          <span>TOTAL:</span>
          <span>{money(order.total)}</span>
        </div>
      </div>

      {/* RODAPÉ */}
      <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '10px' }}>
        <p style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          PAGAMENTO: {order.paymentMethod || "A DEFINIR"}
        </p>
        <p style={{ marginTop: '10px' }}>Obrigado pela preferência!</p>
        <p style={{ fontSize: '8px', opacity: '0.5' }}>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}