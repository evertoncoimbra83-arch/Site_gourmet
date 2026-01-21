import { Badge } from "@/components/ui/badge";

export function UserHistoryTab({ details }: any) {
  const stats = [
    { label: "Total Gasto", val: `R$ ${Number(details?.profile?.totalSpent || 0).toFixed(2)}`, color: "text-emerald-600" },
    { label: "Saldo Fidelidade", val: `${details?.profile?.loyaltyPoints || 0} pts`, color: "text-amber-600" },
    { label: "Pedidos Realizados", val: details?.recentOrders?.length || 0, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className={`text-xl font-black italic tracking-tighter ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              <th className="p-4">Pedido</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-right">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {details?.recentOrders?.map((o: any) => (
              <tr key={o.id} className="text-xs">
                <td className="p-4 font-black text-slate-400">#{o.id}</td>
                <td className="p-4"><Badge variant="outline" className="text-[8px] font-black uppercase rounded-lg border-slate-200">{o.status}</Badge></td>
                <td className="p-4 text-right font-black text-slate-700">R$ {Number(o.total).toFixed(2)}</td>
                <td className="p-4 text-right text-slate-400 font-bold uppercase text-[9px]">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}