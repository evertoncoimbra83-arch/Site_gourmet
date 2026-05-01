import { useCallback, useEffect, useState } from "react";
import { appToast as toast } from "@/lib/app-toast";
import { generateZPLForBatch, type ZebraPhysicalConfig } from "./generator";
import type { PrintLabelElement } from "./templates";

const ZEBRA_VENDOR_ID = 0x0a5f;
const BULK_OUT_ENDPOINT = 1;
const BROWSER_PRINT_URL = "http://127.0.0.1:9100";

interface ZebraBrowserDevice {
  uid: string;
  name: string;
  type: string;
  connection: string;
  version?: number;
}

interface USBDeviceLike {
  productName?: string;
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

interface USBNavigator {
  requestDevice(options: { filters: Array<{ vendorId: number }> }): Promise<USBDeviceLike>;
}

export type ConnectionMethod = "usb" | "browser_print" | "none";

export interface ZebraConnectionState {
  method: ConnectionMethod;
  isReady: boolean;
  isPrinting: boolean;
  deviceName: string | null;
}

export interface PrintBatchSpec {
  elements: PrintLabelElement[];
  widthMm: number;
  heightMm: number;
  flatLabels: unknown[];
  parseContent: (content: string, index: number) => string;
  physical?: ZebraPhysicalConfig;
}

export function useZebraTransport() {
  const [usbDevice, setUsbDevice] = useState<USBDeviceLike | null>(null);
  const [browserDevice, setBrowserDevice] = useState<ZebraBrowserDevice | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const isUSBSupported = typeof navigator !== "undefined" && "usb" in navigator;

  const checkBrowserPrint = useCallback(async (): Promise<ZebraBrowserDevice | null> => {
    try {
      const response = await fetch(`${BROWSER_PRINT_URL}/default`, { method: "GET", mode: "cors" });
      if (!response.ok) return null;
      const data = (await response.json()) as ZebraBrowserDevice;
      if (data && (data.type === "printer" || data.uid)) {
        setBrowserDevice(data);
        return data;
      }
    } catch {
      // noop
    }
    setBrowserDevice(null);
    return null;
  }, []);

  useEffect(() => {
    checkBrowserPrint();
  }, [checkBrowserPrint]);

  const connectUSB = useCallback(async (): Promise<boolean> => {
    if (!isUSBSupported) {
      toast.error("Web USB não suportado neste navegador. Use Chrome ou Edge.");
      return false;
    }

    try {
      const usb = (navigator as Navigator & { usb: USBNavigator }).usb;
      const device = await usb.requestDevice({ filters: [{ vendorId: ZEBRA_VENDOR_ID }] });
      await device.open();

      if (device.configuration == null) {
        await device.selectConfiguration(1);
      }

      const iface = device.configuration?.interfaces.find((item) =>
        item.alternates.some((alt) =>
          alt.endpoints.some((endpoint) => endpoint.direction === "out" && endpoint.type === "bulk"),
        ),
      );

      await device.claimInterface(iface?.interfaceNumber ?? 0);
      setUsbDevice(device);
      toast.success(`Zebra conectada via USB: ${device.productName ?? "Impressora"}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao conectar USB";
      if (message.includes("No device selected")) return false;
      toast.error(`USB: ${message}`);
      return false;
    }
  }, [isUSBSupported]);

  const sendViaUSB = useCallback(
    async (zpl: string): Promise<boolean> => {
      if (!usbDevice) return false;

      try {
        const encoded = new TextEncoder().encode(zpl);
        let endpoint = BULK_OUT_ENDPOINT;

        for (const iface of usbDevice.configuration?.interfaces ?? []) {
          for (const alternate of iface.alternates) {
            const candidate = alternate.endpoints.find(
              (item) => item.direction === "out" && item.type === "bulk",
            );
            if (candidate) {
              endpoint = candidate.endpointNumber;
              break;
            }
          }
        }

        const result = await usbDevice.transferOut(endpoint, encoded);
        if (result.status !== "ok") throw new Error(`USB transfer status: ${result.status}`);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro USB";
        if (message.includes("device disconnected")) setUsbDevice(null);
        toast.error(message.includes("device disconnected") ? "Zebra desconectada. Reconecte o cabo USB." : `Erro USB: ${message}`);
        return false;
      }
    },
    [usbDevice],
  );

  const sendViaBrowserPrint = useCallback(
    async (zpl: string): Promise<boolean> => {
      const toastId = toast.loading("Comunicando com Zebra Browser Print...");
      try {
        const device = browserDevice ?? (await checkBrowserPrint());
        if (!device) throw new Error("Browser Print App não encontrado em 127.0.0.1:9100");

        const response = await fetch(`${BROWSER_PRINT_URL}/write`, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ device, data: zpl }),
        });

        if (!response.ok) throw new Error("Falha ao enviar para o Browser Print App.");
        toast.success("Enviado para a impressora!", { id: toastId });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error(message, { id: toastId });
        return false;
      }
    },
    [browserDevice, checkBrowserPrint],
  );

  const sendZpl = useCallback(
    async (zpl: string): Promise<boolean> => {
      if (!zpl) return false;
      setIsPrinting(true);
      const toastId = toast.loading("Enviando para a Zebra...");

      try {
        if (usbDevice) {
          const usbOk = await sendViaUSB(zpl);
          if (usbOk) {
            toast.success("Impresso via USB!", { id: toastId });
            return true;
          }
          toast.dismiss(toastId);
        }

        toast.dismiss(toastId);
        return await sendViaBrowserPrint(zpl);
      } finally {
        setIsPrinting(false);
      }
    },
    [sendViaBrowserPrint, sendViaUSB, usbDevice],
  );

  const printBatch = useCallback(
    async (spec: PrintBatchSpec) => {
      const zpl = generateZPLForBatch(
        spec.elements,
        spec.widthMm,
        spec.heightMm,
        spec.flatLabels,
        spec.parseContent,
        spec.physical,
      );
      if (!zpl) {
        toast.error("Falha ao gerar o código das etiquetas.");
        return false;
      }
      return sendZpl(zpl);
    },
    [sendZpl],
  );

  const connection: ZebraConnectionState = {
    method: usbDevice ? "usb" : browserDevice ? "browser_print" : "none",
    isReady: !!(usbDevice || browserDevice),
    isPrinting,
    deviceName: usbDevice?.productName ?? browserDevice?.name ?? null,
  };

  return {
    ...connection,
    device: browserDevice,
    isUSBSupported,
    connectUSB,
    checkBrowserPrint,
    sendZpl,
    printBatch,
  };
}

