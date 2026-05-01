import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Hash, MessageSquare, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

// --- INTERFACES ---

interface CustomerOrderData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingAddressNumber?: string;
  shippingAddressComplement?: string;
  shippingNeighborhood?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  deliveryType?: 'pickup' | 'delivery';
  notes?: string;
  [key: string]: unknown;
}

interface AdminOrderCustomerProps {
  order: CustomerOrderData;
  isEditing: boolean;
  editForm: CustomerOrderData;
  setEditForm: (val: CustomerOrderData) => void;
}

export function AdminOrderCustomer({ order, isEditing, editForm, setEditForm }: AdminOrderCustomerProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const displayData = isEditing ? editForm : order;

  // 🔗 GERA LINK DO GOOGLE MAPS
  const fullAddress = `${displayData.shippingAddress || ""}, ${displayData.shippingAddressNumber || ""} - ${displayData.shippingNeighborhood || ""}, ${displayData.shippingCity || ""} - ${displayData.shippingState || ""}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // 📞 GERA LINKS DE TELEFONE
  const cleanPhone = displayData.customerPhone?.replace(/\D/g, "") || "";
  const whatsappUrl = `https://wa.me/55${cleanPhone}`;

  return (
    <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 text-left">
      
      {/* 👤 IDENTIFICAÇÃO */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <User size={14} className="text-emerald-500" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identificação</h3>
        </div>
        
        {isEditing ? (
          <Input 
            value={editForm.customerName || ""} 
            onChange={e => setEditForm({...editForm, customerName: e.target.value})} 
            className="h-10 text-xs font-bold uppercase border-emerald-100 mb-2 rounded-xl" 
          />
        ) : (
          <p className="font-black text-slate-800 uppercase italic text-sm leading-none mb-2">
            {displayData.customerName || "Cliente não Identificado"}
          </p>
        )}

        <div className="space-y-2">
          {displayData.customerEmail && (
            <div className="flex items-center gap-2 text-slate-500">
              <Mail size={12} />
              <span className="text-[10px] font-bold">{displayData.customerEmail}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <a 
              href={`tel:${cleanPhone}`} 
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 hover:underline transition-all"
              title="Ligar para o cliente"
            >
              <Phone size={12} />
              <span className="text-[10px] font-black">{displayData.customerPhone}</span>
            </a>

            {cleanPhone && (
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wide hover:bg-emerald-200 transition-colors flex items-center gap-1"
              >
                WhatsApp <ExternalLink size={8} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 📍 ENDEREÇO E LOGÍSTICA */}
      <div className="pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-slate-400" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {order.deliveryType === 'pickup' ? 'Retirada no Local' : 'Logística de Entrega'}
          </h3>
        </div>
        
        <a 
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="group block space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
          title="Abrir no Google Maps"
        >
          <div className="flex items-start gap-1">
            <p className="text-[11px] font-bold text-slate-700 uppercase leading-tight group-hover:text-blue-600 group-hover:underline decoration-blue-300 underline-offset-2">
              {displayData.shippingAddress || "Endereço não informado"}, {displayData.shippingAddressNumber || ""}
              {displayData.shippingAddressComplement && ` - ${displayData.shippingAddressComplement}`}
            </p>
            <ExternalLink size={10} className="text-slate-300 group-hover:text-blue-500 mt-0.5 shrink-0" />
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase">
            {displayData.shippingNeighborhood} — {displayData.shippingCity}/{displayData.shippingState}
          </p>

          {displayData.shippingZipCode && (
            <div className="flex items-center gap-1.5 mt-1 text-slate-300">
              <Hash size={10} />
              <span className="text-[9px] font-black tracking-tighter">CEP {displayData.shippingZipCode}</span>
            </div>
          )}
        </a>

        {order.deliveryType === 'pickup' && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-black text-amber-700 uppercase">Atenção: Cliente retira no balcão</span>
          </div>
        )}
      </div>

      {/* 📝 ACORDEON DE OBSERVAÇÕES */}
      {displayData.notes && String(displayData.notes).trim() !== "" && (
        <div className="pt-4 border-t border-slate-50">
          <button 
            type="button"
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-amber-500" />
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-slate-600 transition-colors">
                Observações do Cliente
              </h3>
            </div>
            {isNotesOpen ? (
              <ChevronUp size={14} className="text-slate-300" />
            ) : (
              <ChevronDown size={14} className="text-slate-300" />
            )}
          </button>

          {isNotesOpen && (
            <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl animate-in slide-in-from-top-1 fade-in duration-200">
              {/* ✅ CORREÇÃO: Escapando as aspas duplas com entidades HTML */}
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                &quot;{String(displayData.notes)}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}