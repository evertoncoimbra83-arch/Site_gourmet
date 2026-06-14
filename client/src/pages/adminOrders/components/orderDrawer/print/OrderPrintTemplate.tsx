import React from "react";
import {
  formatReceiptMoney,
  getOrderReceiptTotals,
} from "./logic/receiptTotals";

export interface MealOption {
  dishName: string;
  label?: string;
  slotName?: string;
  accompaniments?: Array<{ name: string; weight?: number | string }>;
  selectedAccompaniments?: Array<{ name: string; weight?: number | string }>;
}

export interface ItemOptions {
  sizeName?: string;
  selectedSizeName?: string;
  hasNoAvailableAccompaniments?: boolean;
  noAccompanimentsMessage?: string;
  meals?: MealOption[];
  selectedAccs?: Array<{ name: string; weight?: number | string }>;
  selectedAccompaniments?: Array<{ name: string; weight?: number | string }>;
  parsedOptions?: ItemOptions;
}

export interface OrderItem {
  quantity: number;
  dishName?: string;
  name?: string;
  options?: string | ItemOptions;
  parsedOptions?: ItemOptions;
  packageItems?: MealOption[];
}

export interface OrderData {
  id: string | number;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingAddressNumber?: string;
  shippingAddressComplement?: string;
  shippingNeighborhood?: string;
  shippingCity?: string;
  shippingState?: string;
  deliveryType?: "pickup" | "delivery";
  subtotal: number;
  shippingCost?: number;
  total: number;
  paymentMethodName?: string;
  payment_method?: string;
  discountsSnapshot?: string | null;
  notes?: string | null;
  items: OrderItem[];
  [key: string]: unknown;
}

function safeParseJSON<T>(val: string | object | null | undefined): T | null {
  if (!val) return null;
  if (typeof val === "object") return val as T;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function getAddressLines(order: OrderData): string[] {
  const primary = [
    order.shippingAddress,
    order.shippingAddressNumber ? `, ${order.shippingAddressNumber}` : "",
  ]
    .join("")
    .trim();
  const secondary = [order.shippingAddressComplement, order.shippingNeighborhood]
    .filter(Boolean)
    .join(" - ");
  const tertiary = [order.shippingCity, order.shippingState].filter(Boolean).join(" / ");
  return [primary, secondary, tertiary].filter(Boolean);
}

export default function OrderPrintTemplate({ order }: { order: OrderData | null }) {
  if (!order) return null;

  const totals = getOrderReceiptTotals(order);
  const payMethod = totals.paymentMethodName || "A DEFINIR";
  const addressLines = getAddressLines(order);
  const isPickup = order.deliveryType === "pickup" || addressLines.length === 0;

  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        .print-container {
          width: 80mm;
          max-width: 80mm;
          box-sizing: border-box;
          background: #fff;
          color: #000;
          font-family: "Courier New", Courier, monospace;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 auto;
          padding: 8mm 5mm 6mm;
        }

        .receipt-rule {
          border-top: 1px solid #000;
          margin: 8px 0;
          width: 100%;
        }

        .text-center { text-align: center; }
        .font-black { font-weight: 900 !important; }
        .uppercase { text-transform: uppercase; }

        .section-title {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin: 0 0 4px;
        }

        .block {
          border: 1px solid #000;
          padding: 6px;
          margin-top: 6px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: flex-start;
          margin: 3px 0;
        }
        .row-label {
          flex: 1;
          min-width: 0;
          padding-right: 6px;
          word-break: break-word;
        }
        .row-value {
          white-space: nowrap;
          text-align: right;
        }

        .item {
          margin-bottom: 12px;
        }
        .item-title {
          font-size: 14px;
          font-weight: 900;
          margin: 0 0 3px;
        }
        .item-detail {
          padding-left: 12px;
          font-size: 12px;
          margin: 2px 0 0;
        }

        .total-row {
          font-size: 17px;
          font-weight: 900;
          border-top: 2px solid #000;
          padding-top: 6px;
          margin-top: 6px;
        }

        .badge {
          display: inline-block;
          border: 2px solid #000;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 900;
          margin-top: 4px;
        }

        .obs-block {
          border: 2px dashed #000;
          padding: 8px;
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
        }
      `}</style>

      {/* CABEÇALHO */}
      <div className="text-center">
        <h1 style={{ fontSize: "20px", margin: 0, fontWeight: 900 }}>GOURMET SAUDAVEL</h1>
        <div className="badge">CUPOM NAO FISCAL</div>
        <p style={{ fontSize: "15px", margin: "6px 0 0", fontWeight: 900 }}>
          PEDIDO #{String(order.id).slice(-6).toUpperCase()}
        </p>
      </div>

      <div className="receipt-rule" />

      {/* CLIENTE */}
      <div>
        <p className="section-title uppercase">Cliente</p>
        <div className="block">
          <div className="font-black uppercase">{order.customerName}</div>
          {order.customerPhone ? <div>TEL: {order.customerPhone}</div> : null}
        </div>
      </div>

      {/* ENTREGA / RETIRADA */}
      <div>
        <p className="section-title uppercase" style={{ marginTop: 8 }}>
          {isPickup ? "Retirada" : "Entrega"}
        </p>
        <div className="block">
          {isPickup ? (
            <div className="font-black uppercase">Retirada na loja</div>
          ) : (
            addressLines.map((line) => (
              <div key={line} className="uppercase">{line}</div>
            ))
          )}
        </div>
      </div>

      <div className="receipt-rule" />

      {/* RESUMO DOS ITENS */}
      <p className="text-center font-black uppercase" style={{ fontSize: "12px", margin: 0 }}>
        Resumo do pedido
      </p>

      <div style={{ marginTop: "10px" }}>
        {order.items?.map((item, idx) => {
          const opts = safeParseJSON<ItemOptions>(item.parsedOptions || (item.options as string)) || {};
          const meals = item.packageItems || opts.meals || [];
          const isPkg = meals.length > 0;
          const singleAccs = opts.selectedAccs || opts.selectedAccompaniments || [];
          const noAccompanimentsMessage =
            typeof opts.noAccompanimentsMessage === "string"
              ? opts.noAccompanimentsMessage.trim()
              : "";

          return (
            <div key={idx} className="item">
              <div className="item-title">
                {item.quantity}x {item.name || item.dishName}
                {(opts.sizeName || opts.selectedSizeName) && ` [${opts.sizeName || opts.selectedSizeName}]`}
              </div>

              {isPkg &&
                meals.map((meal, mIdx) => (
                  <div key={mIdx} className="item-detail">
                    <strong className="font-black">- {meal.label || meal.slotName}:</strong>{" "}
                    {String(meal.dishName).toUpperCase()}
                    {(meal.accompaniments || meal.selectedAccompaniments || []).map((acc, aIdx) => (
                      <div key={aIdx} className="item-detail">
                        + {acc.name} {acc.weight ? `(${acc.weight}g)` : ""}
                      </div>
                    ))}
                  </div>
                ))}

              {!isPkg &&
                (singleAccs.length > 0
                  ? singleAccs.map((acc, aIdx) => (
                      <div key={aIdx} className="item-detail">
                        - {acc.name} {acc.weight ? `(${acc.weight}g)` : ""}
                      </div>
                    ))
                  : noAccompanimentsMessage
                    ? (
                        <div className="item-detail">
                          - {noAccompanimentsMessage}
                        </div>
                      )
                    : null)}
            </div>
          );
        })}
      </div>

      <div className="receipt-rule" />

      {/* TOTAIS */}
      <div style={{ fontSize: "13px", fontWeight: 900 }}>
        <div className="row">
          <span className="row-label">SUBTOTAL</span>
          <span className="row-value">{formatReceiptMoney(totals.subtotal)}</span>
        </div>
        <div className="row">
          <span className="row-label">{isPickup ? "RETIRADA" : "FRETE"}</span>
          <span className="row-value">{formatReceiptMoney(totals.shippingCost)}</span>
        </div>

        {totals.discountLines.length > 0 && (
          <>
            <div className="receipt-rule" />
            {totals.discountLines.map((line) => (
              <div key={`${line.key}-${line.label}`} className="row">
                <span className="row-label uppercase">{line.label}</span>
                <span className="row-value">-{formatReceiptMoney(line.amount)}</span>
              </div>
            ))}
          </>
        )}

        <div className="row total-row">
          <span className="row-label">TOTAL</span>
          <span className="row-value">{formatReceiptMoney(totals.total)}</span>
        </div>
      </div>

      {/* PAGAMENTO */}
      <div className="block text-center" style={{ marginTop: "12px", borderWidth: "2px" }}>
        <p className="font-black" style={{ fontSize: "11px", margin: 0 }}>FORMA DE PAGAMENTO</p>
        <p className="font-black uppercase" style={{ fontSize: "17px", margin: "4px 0 0" }}>
          {payMethod}
        </p>
      </div>

      {/* OBSERVAÇÕES DO CLIENTE */}
      {order.notes?.trim() && (
        <div style={{ marginTop: "12px" }}>
          <p className="section-title uppercase">Observacoes do cliente</p>
          <div className="obs-block">
            {order.notes.trim()}
          </div>
        </div>
      )}

      {/* RODAPÉ */}
      <div className="text-center font-black" style={{ marginTop: "16px", fontSize: "11px" }}>
        <p style={{ fontSize: "13px", margin: 0 }}>Obrigado pelo pedido!</p>
        <p>{new Date().toLocaleString("pt-BR")}</p>
        <div style={{ height: "20px" }} />
      </div>
    </div>
  );
}
