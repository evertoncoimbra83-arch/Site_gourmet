import {
  formatReceiptMoney,
  getOrderReceiptTotals,
} from "./receiptTotals";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_SIZE_ON: [GS, 0x21, 0x11],
  DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  SIZE_NORMAL: [GS, 0x21, 0x00],
  CUT_PARTIAL: [GS, 0x56, 0x41, 0x10],
  FEED_5: [ESC, 0x64, 0x05],
};

const encoder = new TextEncoder();

function bytes(...cmds: number[][]): Uint8Array {
  return new Uint8Array(cmds.flat());
}

function text(str: string): Uint8Array {
  const normalized = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7F]/g, "?");
  return encoder.encode(normalized);
}

function line(str = ""): Uint8Array {
  return new Uint8Array([...text(str), LF]);
}

function divider(char = "-", width = 48): Uint8Array {
  return line(char.repeat(width));
}

function wrapText(value: string, width = 48): string[] {
  if (value.length <= width) return [value];

  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (word.length <= width) {
      current = word;
      continue;
    }

    for (let index = 0; index < word.length; index += width) {
      const slice = word.slice(index, index + width);
      if (slice.length === width) {
        lines.push(slice);
      } else {
        current = slice;
      }
    }
  }

  if (current) lines.push(current);
  return lines;
}

function leftRight(left: string, right: string, width = 48): Uint8Array[] {
  const availableLeft = Math.max(8, width - right.length - 1);
  const leftLines = wrapText(left, availableLeft);
  const result: Uint8Array[] = [];

  leftLines.forEach((leftLine, index) => {
    const rightText = index === leftLines.length - 1 ? right : "";
    const spaces = Math.max(1, width - leftLine.length - rightText.length);
    result.push(line(leftLine + " ".repeat(spaces) + rightText));
  });

  return result;
}

function merge(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}

interface Acc {
  name: string;
  weight?: number | string;
}

interface Meal {
  dishName?: string;
  label?: string;
  slotName?: string;
  accompaniments?: Acc[];
  selectedAccompaniments?: Acc[];
}

interface ItemOptions {
  sizeName?: string;
  selectedSizeName?: string;
  noAccompanimentsMessage?: string;
  meals?: Meal[];
  selectedAccs?: Acc[];
  selectedAccompaniments?: Acc[];
}

interface OrderItem {
  quantity: number;
  dishName?: string;
  name?: string;
  options?: string | ItemOptions;
  parsedOptions?: ItemOptions;
  packageItems?: Meal[];
}

export interface ReceiptOrderData {
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
  paymentMethod?: string;
  payment_method?: string;
  discountsSnapshot?: string | null;
  notes?: string;
  items: OrderItem[];
  [key: string]: unknown;
}

function safeJson<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value as string);
  } catch {
    return null;
  }
}

export function generateEscPos(order: ReceiptOrderData): Uint8Array {
  const parts: Uint8Array[] = [];
  const push = (...values: Uint8Array[]) => parts.push(...values);

  const totals = getOrderReceiptTotals(order);
  const payMethod = totals.paymentMethodName || "A DEFINIR";
  const isPickup =
    order.deliveryType === "pickup" ||
    (!order.shippingAddress && !order.shippingNeighborhood && !order.shippingCity);

  push(bytes(CMD.INIT));

  push(bytes(CMD.ALIGN_CENTER));
  push(bytes(CMD.BOLD_ON, CMD.DOUBLE_SIZE_ON));
  push(line("GOURMET SAUDAVEL"));
  push(bytes(CMD.SIZE_NORMAL));
  push(line("CUPOM NAO FISCAL"));
  push(bytes(CMD.BOLD_ON));
  push(line(`PEDIDO #${String(order.id).slice(-6).toUpperCase()}`));
  push(bytes(CMD.BOLD_OFF, CMD.ALIGN_LEFT));
  push(divider("-"));

  push(bytes(CMD.BOLD_ON));
  push(line(`CLIENTE: ${order.customerName.toUpperCase()}`));
  push(bytes(CMD.BOLD_OFF));
  if (order.customerPhone) push(line(`TEL: ${order.customerPhone}`));

  if (isPickup) {
    push(line("RETIRADA: NA LOJA"));
  } else {
    const addressLines = [
      [order.shippingAddress, order.shippingAddressNumber ? `, ${order.shippingAddressNumber}` : ""]
        .join("")
        .trim(),
      [order.shippingAddressComplement, order.shippingNeighborhood].filter(Boolean).join(" - "),
      [order.shippingCity, order.shippingState].filter(Boolean).join(" / "),
    ].filter(Boolean);

    if (addressLines.length > 0) {
      push(line(`ENTREGA: ${String(addressLines[0]).toUpperCase()}`));
      for (const extraLine of addressLines.slice(1)) {
        push(line(`         ${String(extraLine).toUpperCase()}`));
      }
    }
  }

  push(divider("-"));
  push(bytes(CMD.ALIGN_CENTER, CMD.BOLD_ON));
  push(line("RESUMO DO PEDIDO"));
  push(bytes(CMD.ALIGN_LEFT, CMD.BOLD_OFF));
  push(line(""));

  for (const item of order.items) {
    const opts = safeJson<ItemOptions>(item.parsedOptions || (item.options as string)) ?? {};
    const meals = item.packageItems || opts.meals || [];
    const isPackage = meals.length > 0;
    const itemName = (item.name || item.dishName || "ITEM").toUpperCase();
    const size = opts.sizeName || opts.selectedSizeName;
    const noAccompanimentsMessage =
      typeof opts.noAccompanimentsMessage === "string"
        ? opts.noAccompanimentsMessage.trim()
        : "";

    push(bytes(CMD.BOLD_ON));
    push(line(`${item.quantity}x ${itemName}${size ? ` [${size.toUpperCase()}]` : ""}`));
    push(bytes(CMD.BOLD_OFF));

    if (isPackage) {
      for (const meal of meals) {
        const slot = (meal.label || meal.slotName || "").toUpperCase();
        const dish = (meal.dishName || "").toUpperCase();
        push(line(`  ${slot ? `${slot}: ` : ""}${dish}`));
        for (const acc of meal.accompaniments || meal.selectedAccompaniments || []) {
          push(line(`    + ${acc.name.toUpperCase()}${acc.weight ? ` (${acc.weight}g)` : ""}`));
        }
      }
    } else {
      const singleAccs = opts.selectedAccs || opts.selectedAccompaniments || [];
      for (const acc of singleAccs) {
        push(line(`  + ${acc.name.toUpperCase()}${acc.weight ? ` (${acc.weight}g)` : ""}`));
      }
      if (singleAccs.length === 0 && noAccompanimentsMessage) {
        for (const messageLine of wrapText(noAccompanimentsMessage, 44)) {
          push(line(`  ${messageLine}`));
        }
      }
    }

    push(line(""));
  }

  push(divider("-"));

  if (order.notes?.trim()) {
    push(bytes(CMD.BOLD_ON));
    push(line("OBS:"));
    push(bytes(CMD.BOLD_OFF));
    for (const noteLine of wrapText(order.notes.trim(), 46)) {
      push(line(noteLine));
    }
    push(divider("-"));
  }

  push(...leftRight("SUBTOTAL", formatReceiptMoney(totals.subtotal)));
  push(...leftRight(isPickup ? "RETIRADA" : "FRETE", formatReceiptMoney(totals.shippingCost)));

  for (const discountLine of totals.discountLines) {
    push(...leftRight(discountLine.label.toUpperCase(), `-${formatReceiptMoney(discountLine.amount)}`));
  }

  push(divider("-"));
  push(bytes(CMD.BOLD_ON, CMD.DOUBLE_SIZE_ON, CMD.ALIGN_CENTER));
  push(line(`TOTAL ${formatReceiptMoney(totals.total)}`));
  push(bytes(CMD.SIZE_NORMAL, CMD.BOLD_OFF, CMD.ALIGN_LEFT));

  push(divider("-"));
  push(bytes(CMD.ALIGN_CENTER, CMD.BOLD_ON));
  push(line("FORMA DE PAGAMENTO"));
  push(bytes(CMD.DOUBLE_HEIGHT));
  push(line(payMethod.toUpperCase()));
  push(bytes(CMD.SIZE_NORMAL, CMD.BOLD_OFF, CMD.ALIGN_LEFT));

  push(divider("-"));
  push(bytes(CMD.ALIGN_CENTER));
  push(line("BOM APETITE!"));
  push(line(new Date().toLocaleString("pt-BR")));
  push(line("gourmetsaudavel.com"));

  push(bytes(CMD.FEED_5));
  push(bytes(CMD.CUT_PARTIAL));

  return merge(...parts);
}
