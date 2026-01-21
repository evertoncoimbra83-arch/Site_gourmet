import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CSVOrder {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderTotal: number;
  items: Array<{
    optionNumber: number;
    size: string;
    dishName: string;
    accompaniments: string[];
  }>;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  on_hold: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  processing: "Processando",
  pending: "Pendente",
  cancelled: "Cancelado",
  on_hold: "Aguardando",
};

export default function CSVOrdersList() {
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [searchType, setSearchType] = useState<"number" | "email" | "name">("number");

  // Busca lista de pedidos
  const listQuery = trpc.csvOrders.list.useQuery(
    { limit, offset },
    { enabled: !searchTerm }
  );

  // Busca por número de pedido
  const searchNumberQuery = trpc.csvOrders.searchByOrderNumber.useQuery(
    { orderNumber: searchTerm },
    { enabled: !!(searchTerm && searchType === "number") }
  );

  // Busca por email
  const searchEmailQuery = trpc.csvOrders.searchByEmail.useQuery(
    { email: searchTerm },
    { enabled: !!(searchTerm && searchType === "email" && searchTerm.includes("@")) }
  );

  // Busca por nome
  const searchNameQuery = trpc.csvOrders.searchByCustomerName.useQuery(
    { name: searchTerm },
    { enabled: !!(searchTerm && searchType === "name" && searchTerm.length >= 2) }
  );

  // Determina qual query usar
  let orders: CSVOrder[] = [];
  let total = 0;
  let isLoading = false;

  if (searchTerm) {
    if (searchType === "number" && searchNumberQuery.data?.success) {
      orders = searchNumberQuery.data.data;
      isLoading = searchNumberQuery.isLoading;
    } else if (searchType === "email" && searchEmailQuery.data?.success) {
      orders = searchEmailQuery.data.data;
      isLoading = searchEmailQuery.isLoading;
    } else if (searchType === "name" && searchNameQuery.data?.success) {
      orders = searchNameQuery.data.data;
      isLoading = searchNameQuery.isLoading;
    }
  } else {
    if (listQuery.data?.success) {
      orders = listQuery.data.data;
      total = listQuery.data.total;
    }
    isLoading = listQuery.isLoading;
  }

  const toggleExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setOffset(0);
  };

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    setOffset(offset + limit);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Histórico de Pedidos</h1>
        <p className="text-gray-600 mt-2">
          Visualize todos os pedidos antigos do WordPress (somente leitura)
        </p>
      </div>

      {/* Barra de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value as any);
                setSearchTerm("");
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="number">Por Número</option>
              <option value="email">Por Email</option>
              <option value="name">Por Nome</option>
            </select>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder={
                  searchType === "number"
                    ? "Digite o número do pedido..."
                    : searchType === "email"
                      ? "Digite o email..."
                      : "Digite o nome do cliente..."
                }
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => handleSearch("")}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}

      {/* Lista de Pedidos */}
      {!isLoading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.orderId} className="hover:shadow-md transition-shadow">
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleExpanded(order.orderId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pedido #{order.orderNumber}
                      </h3>
                      <Badge className={statusColors[order.status] || "bg-gray-100"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Cliente</p>
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium text-gray-900 truncate">{order.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Data</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(order.orderDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-bold text-emerald-600">
                          R$ {order.orderTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {expandedOrders.has(order.orderId) ? (
                      <ChevronUp className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes Expandidos */}
              {expandedOrders.has(order.orderId) && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="space-y-4">
                    {/* Informações do Cliente */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Informações do Cliente</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Nome</p>
                          <p className="text-gray-900">{order.customerName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="text-gray-900">{order.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Telefone</p>
                          <p className="text-gray-900">{order.customerPhone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Itens do Pedido</h4>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-md border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  Opção {item.optionNumber}: {item.dishName}
                                </p>
                                <p className="text-sm text-gray-600">Tamanho: {item.size}</p>
                              </div>
                            </div>

                            {item.accompaniments.length > 0 && (
                              <div className="mt-2 pl-4 border-l-2 border-emerald-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                  Acompanhamentos:
                                </p>
                                <ul className="space-y-1">
                                  {item.accompaniments.map((acc, accIdx) => (
                                    <li key={accIdx} className="text-sm text-gray-700">
                                      • {acc}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumo */}
                    <div className="bg-white p-3 rounded-md border border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total do Pedido:</span>
                        <span className="text-lg font-bold text-emerald-600">
                          R$ {order.orderTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">
              {searchTerm ? "Nenhum pedido encontrado com esses critérios." : "Nenhum pedido disponível."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {!searchTerm && !isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {offset + 1} a {Math.min(offset + limit, total)} de {total} pedidos
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={offset === 0}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={offset + limit >= total}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
