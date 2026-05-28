import type { ElementType } from "react";
import {
  BrainCircuit,
  CreditCard,
  Palette,
  ServerCog,
  ShieldAlert,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";

export type SettingsAreaId =
  | "store"
  | "operation"
  | "appearance"
  | "integrations"
  | "ia"
  | "security";

export interface SettingsShortcut {
  title: string;
  description: string;
  href: string;
  icon: ElementType;
  badge?: string;
}

export interface SettingsArea {
  id: SettingsAreaId;
  label: string;
  description: string;
  icon: ElementType;
  accent: string;
  badges?: string[];
  shortcuts?: SettingsShortcut[];
}

export const settingsAreas: SettingsArea[] = [
  {
    id: "store",
    label: "Loja",
    description:
      "Identidade da marca, contatos e dados principais da operacao.",
    icon: Store,
    accent: "text-emerald-600",
    badges: ["Identidade", "Atendimento"],
    shortcuts: [],
  },
  {
    id: "operation",
    label: "Operacao",
    description:
      "Mensagens de checkout e configuracoes operacionais do pos-pedido.",
    icon: CreditCard,
    accent: "text-amber-600",
    badges: ["Vendas", "Checkout"],
    shortcuts: [
      {
        title: "Meios de Pagamento",
        description: "Configure cartoes, Pix e bandeiras aceitas.",
        href: "/admin/payment-methods",
        icon: CreditCard,
      },
      {
        title: "Logística & Fretes",
        description: "Configure taxas e perímetros de entrega.",
        href: "/admin/shipping",
        icon: Truck,
      },
    ],
  },
  {
    id: "appearance",
    label: "Aparencia",
    description:
      "Acessibilidade, favicon e atalhos para identidade visual da loja.",
    icon: Palette,
    accent: "text-violet-600",
    badges: ["Branding", "UI"],
    shortcuts: [
      {
        title: "Cores e Tema",
        description: "Personalize a paleta e o estilo global da vitrine.",
        href: "/admin/theme",
        icon: Palette,
      },
      {
        title: "Arquivos e Midia",
        description: "Gerencie logos, icones e imagens da operacao.",
        href: "/admin/media",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "integrations",
    label: "Integracoes",
    description:
      "Centralize GTM, GA4, OAuth Google e servicos externos relacionados.",
    icon: ServerCog,
    accent: "text-cyan-700",
    badges: ["Google", "OAuth"],
    shortcuts: [],
  },
  {
    id: "ia",
    label: "Inteligencia Artificial",
    description:
      "Recursos de IA, Gemini e o acesso administrativo do GourmetIA Bridge.",
    icon: BrainCircuit,
    accent: "text-blue-600",
    badges: ["Gemini", "Bridge"],
    shortcuts: [
      {
        title: "GourmetIA Bridge",
        description: "Abra a tela de token e rotacao de chave administrativa.",
        href: "/admin/integration",
        icon: BrainCircuit,
        badge: "PRO",
      },
    ],
  },
  {
    id: "security",
    label: "Seguranca",
    description:
      "Backups, diagnosticos e protecao de credenciais da administracao.",
    icon: ShieldAlert,
    accent: "text-rose-600",
    badges: ["Backups", "Auditoria"],
    shortcuts: [],
  },
];

export const defaultAreaId: SettingsAreaId = "store";
export const settingsAreaIds = settingsAreas.map((area) => area.id);

export function isSettingsAreaId(
  value: string | null,
): value is SettingsAreaId {
  return value !== null && settingsAreaIds.includes(value as SettingsAreaId);
}
