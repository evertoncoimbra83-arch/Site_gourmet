// client/src/pages/adminOrders/components/orderDrawer/print/hooks/useReceiptPrint.ts
//
// Impressão nativa de cupom via Web USB (ESC/POS).
// Sem diálogo do browser. Sem renderização HTML. Envia bytes direto para a
// impressora térmica — exatamente como sistemas de PDV profissionais funcionam.
//
// Compatível com: Bematech MP-4200, Elgin i9, Epson TM-T20, Daruma DR-800.
// Qualquer impressora 80mm com USB que suporte ESC/POS.

import { useState, useCallback } from "react";
import { appToast as toast } from "@/lib/app-toast";
import { generateEscPos, type ReceiptOrderData } from "../logic/EscPosGenerator";

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
}

// IDs USB comuns de impressoras térmicas ESC/POS
// Se sua impressora não estiver aqui, o seletor do browser ainda vai listar ela
const RECEIPT_PRINTER_FILTERS: USBDeviceFilter[] = [
  { vendorId: 0x0519 }, // Bematech
  { vendorId: 0x20D1 }, // Elgin
  { vendorId: 0x04B8 }, // Epson
  { vendorId: 0x1504 }, // Daruma
  { vendorId: 0x154F }, // SNBC / Citizen
  { vendorId: 0x0FE6 }, // ICS Advent (genérico)
];

export type ReceiptPrintMethod = "usb" | "window" | "none";

export interface ReceiptPrinterState {
  isReady: boolean;
  isPrinting: boolean;
  method: ReceiptPrintMethod;
  deviceName: string | null;
}

// ── WebUSB Type Definitions ──────────────────────────────────────────────────

interface USBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  opened: boolean;
  configuration?: {
    interfaces: Array<{
      interfaceNumber: number;
      alternates: Array<{
        endpoints: Array<{
          direction: "in" | "out";
          type: "bulk" | "interrupt" | "isochronous";
          endpointNumber: number;
        }>;
      }>;
    }>;
  };
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<{ status: string }>;
}

interface USB {
  requestDevice(options: { filters: Array<USBDeviceFilter> }): Promise<USBDevice>;
}

export function useReceiptPrint() {
  const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const isUSBSupported =
    typeof navigator !== "undefined" && "usb" in navigator;

  // ── Conectar impressora via USB ──────────────────────────────────────────
  const connectUSB = useCallback(async (): Promise<boolean> => {
    if (!isUSBSupported) {
      toast.error("Web USB não disponível. Use Chrome ou Edge.");
      return false;
    }

    try {
      const device = await (navigator as Navigator & { usb: USB }).usb.requestDevice({
        filters: RECEIPT_PRINTER_FILTERS,
      });

      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);

      // Encontra a interface de impressão (bulk OUT)
      const iface = device.configuration?.interfaces.find((i) =>
        i.alternates.some((a) =>
          a.endpoints.some((e) => e.direction === "out" && e.type === "bulk")
        )
      );
      await device.claimInterface(iface?.interfaceNumber ?? 0);

      setUsbDevice(device);
      toast.success(`Impressora conectada: ${device.productName ?? "Térmica"}`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("No device selected")) return false; // usuário cancelou
      toast.error(`USB: ${msg || "Erro ao conectar impressora"}`);
      return false;
    }
  }, [isUSBSupported]);

  const disconnectUSB = useCallback(async () => {
    if (!usbDevice) return;
    try { await usbDevice.close(); } catch { /* silencia */ }
    setUsbDevice(null);
    toast("Impressora desconectada.");
  }, [usbDevice]);

  // ── Enviar bytes para a impressora USB ───────────────────────────────────
  const sendBytes = useCallback(async (data: Uint8Array): Promise<boolean> => {
    if (!usbDevice) return false;

    // Encontra o endpoint bulk OUT
    let endpointNum = 1;
    for (const iface of usbDevice.configuration?.interfaces ?? []) {
      for (const alt of iface.alternates) {
        const ep = alt.endpoints.find(
          (e) => e.direction === "out" && e.type === "bulk"
        );
        if (ep) { endpointNum = ep.endpointNumber; break; }
      }
    }

    try {
      // Converte explicitamente para Uint8Array padrão para evitar incompatibilidade com SharedArrayBuffer
      const result = await usbDevice.transferOut(endpointNum, new Uint8Array(data));
      if (result.status !== "ok") throw new Error(`USB status: ${result.status}`);
      return true;
    } catch (err) {
      if (err instanceof Error && err.message.includes("disconnected")) {
        setUsbDevice(null);
        toast.error("Impressora desconectada. Verifique o cabo USB.");
      } else {
        toast.error(`Erro USB: ${err instanceof Error ? err.message : "Desconhecido"}`);
      }
      return false;
    }
  }, [usbDevice]);

  // ── API pública: imprimir pedido ─────────────────────────────────────────

  /**
   * Impressão via USB (ESC/POS nativo — sem diálogo)
   */
  const printReceiptUSB = useCallback(
    async (order: ReceiptOrderData): Promise<boolean> => {
      if (!usbDevice) {
        toast.error("Conecte a impressora USB primeiro.");
        return false;
      }

      setIsPrinting(true);
      const toastId = toast.loading("Imprimindo cupom...");

      try {
        const escposData = generateEscPos(order);
        const ok = await sendBytes(escposData);
        if (ok) toast.success("Cupom impresso!", { id: toastId });
        else toast.dismiss(toastId);
        return ok;
      } finally {
        setIsPrinting(false);
      }
    },
    [usbDevice, sendBytes]
  );

  /**
   * Impressão via browser (window.print — fallback com diálogo)
   */
  const printReceiptBrowser = useCallback(() => {
    window.print();
  }, []);

  /**
   * Impressão automática: USB se disponível, browser como fallback
   */
  const print = useCallback(
    async (order: ReceiptOrderData): Promise<void> => {
      if (usbDevice) {
        await printReceiptUSB(order);
      } else {
        printReceiptBrowser();
      }
    },
    [usbDevice, printReceiptUSB, printReceiptBrowser]
  );

  // ── Estado consolidado ───────────────────────────────────────────────────
  const state: ReceiptPrinterState = {
    isReady:    !!usbDevice,
    isPrinting,
    method:     usbDevice ? "usb" : "window",
    deviceName: usbDevice?.productName ?? null,
  };

  return {
    ...state,
    isUSBSupported,
    connectUSB,
    disconnectUSB,
    print,
    printReceiptUSB,
    printReceiptBrowser,
  };
}