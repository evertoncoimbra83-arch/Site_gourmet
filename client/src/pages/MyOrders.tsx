import React from "react";
import { trpc } from "../_core/trpc";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Clock, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

export default function MyOrders() {
  const [, setLocation] = useLocation();
  const { data: orders, isLoading, error } = trpc.orders.list.useQuery();

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
      <span>Carregando...</span>
    </div>
  );

  if (error || !orders) return (
    <div className="text-center py-20">
      <p className="text-red-500">Erro ao carregar ou nenhum dado recebido.</p>
      <Button onClick={() => window.location.reload()} className="mt-4">Recarregar</Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p>Você ainda não tem pedidos.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order: any) => (
            <Card key={order?.id || Math.random()}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-mono">
                    ID: {order?.id || "N/A"}
                  </CardTitle>
                  <span className="text-xs text-gray-400">
                    {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <Badge>{order?.status || "Pendente"}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-600">
                  {Number(order?.total || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {order?.items?.length || 0} itens no pedido
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}