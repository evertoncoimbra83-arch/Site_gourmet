// client/src/pages/adminSettings/config/settingsAreas.ts
import {
  BarChart3,
  Bot,
  BrainCircuit,
  CreditCard,
  LayoutTemplate,
  Mail,
  MapPin,
  MonitorCog,
  PackageCheck,
  Palette,
  ServerCog,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wand2,
  Workflow,
} from "lucide-react";

export type SettingsAreaId =
  | "store"
  | "operation"
  | "security"
  | "ia"
  | "appearance"
  | "integrations";

export interface SettingsShortcut {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export interface SettingsArea {
  id: SettingsAreaId;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  badges?: string[];
  shortcuts?: SettingsShortcut[];
}

export const settingsAreas: SettingsArea[] = [
  {
    id: "store",
    label: "Loja",
    description: "Dados públicos, contato, retirada e identidade base da operação.",
    icon: Store,
    accent: "text-emerald-600",
    badges: ["Base da loja", "Contato"],
    shortcuts: [
      {
        title: "Logística Geral",
        description: "Horários, retirada e regras por loja ficam na área dedicada.",
        href: "/admin/shipping",
        icon: MapPin,
      },
      {
        title: "Biblioteca de Mídia",
        description: "Gerencie logo e arquivos visuais usados na loja.",
        href: "/admin/media",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "operation",
    label: "Operação",
    description: "Fluxos de pedido, checkout, entrega, pagamento e regras comerciais.",
    icon: PackageCheck,
    accent: "text-amber-600",
    badges: ["Pedidos", "Hub"],
    shortcuts: [
      {
        title: "Entrega e Frete",
        description: "Regras de frete, malha e pontos de retirada.",
        href: "/admin/shipping",
        icon: Truck,
      },
      {
        title: "Métodos de Pagamento",
        description: "Cadastre e ordene meios de pagamento ativos.",
        href: "/admin/payment-methods",
        icon: CreditCard,
      },
      {
        title: "Fidelidade",
        description: "Configuração comercial do clube e histórico dos clientes.",
        href: "/admin/loyalty",
        icon: Workflow,
      },
      {
        title: "Regras de Desconto",
        description: "Ofertas, cupons e regras comerciais existentes.",
        href: "/admin/offers",
        icon: ShoppingBag,
      },
    ],
  },
  {
    id: "security",
    label: "Segurança",
    description: "Diagnóstico, modo de emergência, backups, ambiente e auditoria.",
    icon: ShieldAlert,
    accent: "text-rose-600",
    badges: ["Admin only", "Produção"],
    shortcuts: [
      {
        title: "Logs do Sistema",
        description: "Auditoria operacional e inspeção de eventos administrativos.",
        href: "/admin/logs",
        icon: MonitorCog,
      },
    ],
  },
  {
    id: "ia",
    label: "IA & Automação",
    description: "Chaves de IA, BI, conectores automáticos e workers do ecossistema.",
    icon: BrainCircuit,
    accent: "text-blue-600",
    badges: ["Workers", "Automação"],
    shortcuts: [
      {
        title: "Integração IA",
        description: "Área dedicada para o bridge e rotinas externas.",
        href: "/admin/integration",
        icon: Bot,
        badge: "BETA",
      },
      {
        title: "Etiquetas & Produção",
        description: "Fila operacional e automações de impressão.",
        href: "/admin/labels/editor/production",
        icon: Wand2,
      },
      {
        title: "BI & Analytics",
        description: "Acompanhe saúde e efeitos das automações em painéis dedicados.",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "appearance",
    label: "Aparência",
    description: "Tema, vitrines, favicon, mídia e experiência visual do site.",
    icon: Palette,
    accent: "text-violet-600",
    badges: ["Tema", "Visual"],
    shortcuts: [
      {
        title: "Tema do Site",
        description: "Cores, branding visual e aparência da interface pública.",
        href: "/admin/theme",
        icon: Palette,
      },
      {
        title: "Vitrines da Home",
        description: "Gerencie a curadoria visual da página inicial.",
        href: "/admin/showcases",
        icon: LayoutTemplate,
      },
      {
        title: "Biblioteca de Mídia",
        description: "Arquivos de logo, banners e ativos reutilizáveis.",
        href: "/admin/media",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrações",
    description: "Serviços externos de e-mail, mídia, analytics e conectores.",
    icon: ServerCog,
    accent: "text-cyan-700",
    badges: ["Hub", "Serviços externos"],
    shortcuts: [
      {
        title: "E-mail Transacional",
        description: "SMTP, layouts e conectividade de mensagens.",
        href: "/admin/mail",
        icon: Mail,
      },
      {
        title: "Cloudinary e Arquivos",
        description: "Mídia e ativos externos já usados pela aplicação.",
        href: "/admin/media",
        icon: Sparkles,
      },
      {
        title: "Integração IA",
        description: "Conectores externos e sincronismos dedicados.",
        href: "/admin/integration",
        icon: Bot,
        badge: "BETA",
      },
      {
        title: "Analytics",
        description: "Painéis e monitoramento associados às integrações.",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
];

export const defaultAreaId: SettingsAreaId = "store";
export const settingsAreaIds = settingsAreas.map((a) => a.id);

export function isSettingsAreaId(value: string | null): value is SettingsAreaId {
  return value !== null && settingsAreaIds.includes(value as SettingsAreaId);
}