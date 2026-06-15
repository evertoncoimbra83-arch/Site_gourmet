import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { appToast as toast } from "@/lib/app-toast";

interface FormItem {
  rawDescription: string;
  quantity: string;
  unit: string;
  totalPrice: string;
}

interface PurchaseEntryFormProps {
  onSuccess: () => void;
}

export function PurchaseEntryForm({ onSuccess }: PurchaseEntryFormProps) {
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierNameSnapshot, setSupplierNameSnapshot] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  const [items, setItems] = useState<FormItem[]>([
    { rawDescription: "", quantity: "", unit: "kg", totalPrice: "" },
  ]);

  // Modais de fornecedor
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCnpj, setNewSupplierCnpj] = useState("");

  // Queries
  const { data: suppliersList, refetch: refetchSuppliers } =
    trpc.admin.purchases.listSuppliers.useQuery({
      search: supplierSearch || undefined,
    });

  // Mutations
  const createSupplierMutation = trpc.admin.purchases.createSupplier.useMutation({
    onSuccess: (res) => {
      setSelectedSupplierId(res.id);
      setSupplierNameSnapshot(newSupplierName);
      setSupplierSearch(newSupplierName);
      setShowNewSupplierModal(false);
      setNewSupplierName("");
      setNewSupplierCnpj("");
      refetchSuppliers();
      toast.success("Fornecedor cadastrado!");
    },
    onError: (err) => {
      toast.error("Erro ao cadastrar fornecedor", { description: err.message });
    },
  });

  const createEntryMutation = trpc.admin.purchases.createEntry.useMutation({
    onSuccess: () => {
      toast.success("Compra lançada com sucesso!");
      onSuccess();
    },
    onError: (err) => {
      toast.error("Erro ao lançar compra", { description: err.message });
    },
  });

  const handleAddItem = () => {
    setItems([...items, { rawDescription: "", quantity: "", unit: "kg", totalPrice: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);

    // Auto-calcula o total somando os itens
    const sum = updated.reduce((acc, it) => acc + (parseFloat(it.totalPrice) || 0), 0);
    setTotalAmount(sum.toFixed(2));
  };

  const handleSave = () => {
    if (!supplierNameSnapshot) {
      toast.warning("Nome do fornecedor é obrigatório.");
      return;
    }

    const payloadItems = items.map((it) => ({
      rawDescription: it.rawDescription,
      quantity: parseFloat(it.quantity) || 0,
      unit: it.unit,
      totalPrice: parseFloat(it.totalPrice) || 0,
    }));

    // Validação básica
    for (const it of payloadItems) {
      if (!it.rawDescription.trim()) {
        toast.warning("Todos os itens devem conter uma descrição.");
        return;
      }
      if (it.quantity <= 0) {
        toast.warning("A quantidade de todos os itens deve ser maior que zero.");
        return;
      }
      if (it.totalPrice < 0) {
        toast.warning("O preço total dos itens não pode ser negativo.");
        return;
      }
    }

    createEntryMutation.mutate({
      supplierId: selectedSupplierId,
      supplierNameSnapshot,
      invoiceNumber: invoiceNumber || undefined,
      purchasedAt: new Date(purchasedAt),
      totalAmount: parseFloat(totalAmount) || 0,
      notes: notes || undefined,
      source: "manual",
      items: payloadItems,
    });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fornecedor */}
        <div className="space-y-2 flex flex-col justify-end">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Fornecedor</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Pesquisar ou digite fornecedor..."
                className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setSupplierNameSnapshot(e.target.value);
                  setSelectedSupplierId(null);
                }}
              />
              {supplierSearch && suppliersList && suppliersList.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                  {suppliersList.map((sup) => (
                    <div
                      key={sup.id}
                      onClick={() => {
                        setSelectedSupplierId(sup.id);
                        setSupplierNameSnapshot(sup.name);
                        setSupplierSearch(sup.name);
                      }}
                      className="px-4 py-3 text-xs font-bold hover:bg-emerald-50 cursor-pointer text-slate-700 transition-colors"
                    >
                      {sup.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={() => {
                setNewSupplierName(supplierSearch);
                setShowNewSupplierModal(true);
              }}
              className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4"
            >
              Novo
            </Button>
          </div>
        </div>

        {/* Data Compra */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Data da Compra</Label>
          <Input
            type="date"
            className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
            value={purchasedAt}
            onChange={(e) => setPurchasedAt(e.target.value)}
          />
        </div>

        {/* Número da Nota */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Número da Nota (NF)</Label>
          <Input
            placeholder="Ex: 000.123.456"
            className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
      </div>

      {/* Grade de Itens */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Itens Comprados</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {/* Descrição Bruta */}
              <div className="md:col-span-6 space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Descrição do Item (como na Nota)</Label>
                <Input
                  placeholder="Ex: Peito de Frango Congelado 10kg"
                  className="h-11 bg-white border-slate-100 rounded-xl font-bold text-xs"
                  value={item.rawDescription}
                  onChange={(e) => handleItemChange(index, "rawDescription", e.target.value)}
                />
              </div>

              {/* Quantidade */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Qtd</Label>
                <Input
                  type="number"
                  placeholder="2"
                  className="h-11 bg-white border-slate-100 rounded-xl font-bold text-center text-xs"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                />
              </div>

              {/* Unidade */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Unidade</Label>
                <select
                  className="w-full h-11 bg-white border border-slate-100 rounded-xl font-bold text-xs px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="un">un</option>
                  <option value="pacote">pacote</option>
                  <option value="rolo">rolo</option>
                  <option value="caixa">caixa</option>
                </select>
              </div>

              {/* Preço Total do Item */}
              <div className="md:col-span-2 space-y-1 relative">
                <Label className="text-[9px] font-black uppercase text-slate-400">Preço Total (R$)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="120.00"
                    className="h-11 bg-white border-slate-100 rounded-xl font-bold text-center text-xs flex-1"
                    value={item.totalPrice}
                    onChange={(e) => handleItemChange(index, "totalPrice", e.target.value)}
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="h-11 w-11 shrink-0 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={handleAddItem}
          className="h-11 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl px-5 font-bold text-xs uppercase"
        >
          Adicionar Item
        </Button>
      </div>

      {/* Notas e Observações */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Observações Gerais</Label>
        <textarea
          placeholder="Comentários sobre a compra..."
          className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs text-slate-700 focus:outline-none min-h-24"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Total e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-6 border-t border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Valor Total Consolidado</span>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">R$ {totalAmount || "0,00"}</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={createEntryMutation.isPending}
          className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          {createEntryMutation.isPending ? <Loader2 className="animate-spin" /> : "Concluir Lançamento"}
        </Button>
      </div>

      {/* Modal Novo Fornecedor */}
      <Dialog open={showNewSupplierModal} onOpenChange={setShowNewSupplierModal}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border-none shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black uppercase text-slate-900">Novo Fornecedor</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cadastrar fornecedor rapidamente na base técnica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400">Nome Comercial</Label>
              <Input
                className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400">CNPJ (Opcional)</Label>
              <Input
                placeholder="00.000.000/0001-00"
                className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                value={newSupplierCnpj}
                onChange={(e) => setNewSupplierCnpj(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNewSupplierModal(false)}
              className="h-12 px-5 font-bold text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => createSupplierMutation.mutate({ name: newSupplierName, cnpj: newSupplierCnpj })}
              disabled={createSupplierMutation.isPending}
              className="h-12 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider px-6 rounded-xl hover:bg-emerald-700"
            >
              {createSupplierMutation.isPending ? <Loader2 className="animate-spin" /> : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
