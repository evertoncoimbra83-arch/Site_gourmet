import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Package, Star, User } from "lucide-react";
import type { ProfileTabKey } from "../logic/ProfileLogic";

export function ProfileSidebar({ activeTab }: { activeTab: ProfileTabKey }) {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <TabsList className="flex flex-row md:flex-col h-auto bg-white border shadow-sm rounded-xl p-2 w-full overflow-x-auto md:overflow-hidden">
        <TabsTrigger
          value="dados"
          className="flex-1 md:flex-none justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
        >
          <User className="h-4 w-4" />{" "}
          <span className="hidden md:inline">Dados Pessoais</span>
        </TabsTrigger>

        <TabsTrigger
          value="pedidos"
          className="flex-1 md:flex-none justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
        >
          <Package className="h-4 w-4" />{" "}
          <span className="hidden md:inline">Pedidos</span>
        </TabsTrigger>

        <TabsTrigger
          value="fidelidade"
          className="flex-1 md:flex-none justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
        >
          <Star className="h-4 w-4" />{" "}
          <span className="hidden md:inline">Fidelidade</span>
        </TabsTrigger>

        <TabsTrigger
          value="enderecos"
          className="flex-1 md:flex-none justify-start gap-3 px-4 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
        >
          <MapPin className="h-4 w-4" />{" "}
          <span className="hidden md:inline">Endereços</span>
        </TabsTrigger>
      </TabsList>
    </aside>
  );
}
