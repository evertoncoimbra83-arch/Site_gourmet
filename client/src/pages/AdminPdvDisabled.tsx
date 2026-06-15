import { ShoppingCart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminPdvDisabled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-10 text-left">
      <section className="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
              Operação pausada
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Comandas Salão temporariamente desativado
            </h1>
          </div>
        </div>

        <p className="text-sm font-semibold leading-6 text-slate-500">
          Use a Venda Manual para criar pedidos administrativos enquanto o fluxo
          de comandas permanece fora da operação.
        </p>

        <Button
          onClick={() => navigate("/admin/orders/create")}
          className="h-12 w-full rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-slate-800 md:w-fit md:px-6"
        >
          Abrir Venda Manual
          <ArrowRight size={16} />
        </Button>
      </section>
    </div>
  );
}
