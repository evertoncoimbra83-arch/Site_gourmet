import{j as n,c as F}from"./index-ZfMF-T0M.js";import{R as M}from"./useLabelLogic-BqaTGBUc.js";function C(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function $(t){if(typeof t!="string")return!1;const e=t.trim();return!(!e||e==="undefined"||e==="null"||e==="[object Object]")}function N(t){return Math.round(t*100)/100}function G(t){if(!t)return null;if(C(t))return t;if(typeof t!="string")return null;try{const e=JSON.parse(t);return C(e)?e:null}catch{return null}}function T(...t){for(const e of t)if($(e))return e.trim();return null}function R(...t){for(const e of t){const i=P(e);if(i!==null)return i}return 0}function P(t){if(t==null||t==="")return null;if(typeof t=="number"&&Number.isFinite(t))return N(t);const e=String(t).replace(/[^\d,.-]/g,"").replace(",",".");if(!e)return null;const i=Number(e);return Number.isFinite(i)?N(i):null}function I(t){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Math.abs(N(t)))}function B(t,e){const i=C(e==null?void 0:e.totals)?e.totals:null,o=T(t.couponCode,e==null?void 0:e.couponCode),l=T(t.couponDescription,e==null?void 0:e.couponDescription),a=T(t.autoDiscountName,e==null?void 0:e.autoDiscountName),m=T(t.paymentMethodName,t.paymentMethod,t.payment_method,e==null?void 0:e.paymentMethodName),c=[],f=R(i==null?void 0:i.autoDiscount,e==null?void 0:e.autoDiscount,t.autoDiscount);f>0&&c.push({key:"auto",label:a||"Desconto automatico",amount:f});const u=R(i==null?void 0:i.couponDiscount,e==null?void 0:e.couponDiscount,t.couponDiscount);u>0&&c.push({key:"coupon",label:o?`Cupom ${o}`:l?`Cupom ${l}`:"Cupom",amount:u});const A=R(t.loyaltyDiscount,t.loyalty_discount,i==null?void 0:i.loyaltyDiscount,e==null?void 0:e.loyaltyDiscount,e==null?void 0:e.loyaltyValue);A>0&&c.push({key:"loyalty",label:"Fidelidade",amount:A});const j=R(i==null?void 0:i.paymentDiscount,e==null?void 0:e.paymentDiscount,t.paymentDiscount);return j>0&&c.push({key:"payment",label:m?`Desconto ${m}`:"Desconto pagamento",amount:j}),c}function V(t){const e=C(t)?t:{},i=G(e.discountsSnapshot),o=C(i==null?void 0:i.totals)?i.totals:null,l=R(e.subtotal,o==null?void 0:o.subtotal),a=R(e.shippingCost,e.shipping,o==null?void 0:o.shipping),m=R(e.total,i==null?void 0:i.finalNetCalculated,o==null?void 0:o.total),c=T(e.couponCode,i==null?void 0:i.couponCode),f=T(e.couponDescription,i==null?void 0:i.couponDescription),u=T(e.autoDiscountName,i==null?void 0:i.autoDiscountName),A=T(e.paymentMethodName,e.paymentMethod,e.payment_method,i==null?void 0:i.paymentMethodName),j=B(e,i),r=N(j.reduce((d,b)=>d+N(b.amount),0)),p=R(e.discountAmount,e.totalDiscount,i==null?void 0:i.discountAmount,o==null?void 0:o.totalDiscounts),g=l>0||a>0||m>0?N(Math.max(0,l+a-m)):0;let y=[...j],k=r;k<=0&&p>0&&(y=[{key:"generic",label:"Desconto",amount:p}],k=p);const x=g>0?g:p,v=N(x-k);v>.01?(y.push({key:"generic",label:"Outros descontos",amount:v}),k=N(k+v)):x>0&&(k=x);const D=N(y.filter(d=>d.key==="coupon").reduce((d,b)=>d+b.amount,0)),s=N(y.filter(d=>d.key==="loyalty").reduce((d,b)=>d+b.amount,0)),S=N(y.filter(d=>d.key==="auto").reduce((d,b)=>d+b.amount,0)),z=N(y.filter(d=>d.key==="payment").reduce((d,b)=>d+b.amount,0));return{subtotal:l,shippingCost:a,discountTotal:N(k),couponDiscount:D,loyaltyDiscount:s,autoDiscount:S,paymentDiscount:z,total:m,couponCode:c,couponDescription:f,autoDiscountName:u,paymentMethodName:A,discountLines:y.filter(d=>d.amount>0)}}const U=t=>t.normalize("NFD").replace(/[\u0300-\u036f]/g,""),h=(t,e)=>{const i=String(t??"");return e==="zebra"?U(i):i};function W(t){if(t==null)return null;if(typeof t=="object")return t;if(typeof t=="string"){const e=t.trim();if(!e||e==="null"||e==="undefined")return null;try{const i=e.startsWith('"')&&e.endsWith('"')?JSON.parse(e):e,o=typeof i=="string"?JSON.parse(i):i;return o&&typeof o=="object"?o:null}catch{return null}}return null}const w=t=>{if(t==null||t==="")return 0;const e=Number(String(t).replace(",","."));return Number.isFinite(e)?e:0},J=({data:t,fontSize:e=7,variant:i="vertical",target:o="web"})=>{const l=s=>`${s/7*e}px`,a=W(t);if(!a)return null;const m=Math.round(w(a.energyKcal??a.energy_kcal??a.kcal)),c=Math.round(w(a.energyKj??a.energy_kj??m*4.2)),f=w(a.carbs??a.carbohydrates??0),u=w(a.sugars??a.totalSugars??0),A=w(a.addedSugars??a.added_sugars??0),j=w(a.proteins??a.protein??0),r=w(a.fatTotal??a.fat_total??a.fats??0),p=w(a.fatSaturated??a.fat_saturated??a.saturatedFats??0),g=w(a.fatTrans??a.fat_trans??a.transFats??0),y=w(a.fiber??a.dietary_fiber??0),k=w(a.sodium??a.salt??0),x=w(a.yieldWeight??a.yield_weight??0)||100,v=[{key:"energyKcal",label:"Valor energetico",val:m,unit:"kcal"},{key:"energyKj",label:"Valor energetico",val:c,unit:"kJ",isSecondary:!0},{key:"carbs",label:"Carboidratos",val:f,unit:"g"},{key:"sugars",label:"Acucares totais",val:u,unit:"g",indent:!0},{key:"addedSugars",label:"Acucares adicionados",val:A,unit:"g",indent:!0},{key:"proteins",label:"Proteinas",val:j,unit:"g"},{key:"fatTotal",label:"Gorduras totais",val:r,unit:"g"},{key:"fatSaturated",label:"Gorduras saturadas",val:p,unit:"g",indent:!0},{key:"fatTrans",label:"Gorduras trans",val:g,unit:"g",indent:!0},{key:"fiber",label:"Fibra alimentar",val:y,unit:"g"},{key:"sodium",label:"Sodio",val:k,unit:"mg"}],D=(s,S)=>{const z=S==="kcal"||S==="kJ"||S==="mg";return s.toLocaleString("pt-BR",{minimumFractionDigits:z?0:1,maximumFractionDigits:z?0:1})};return i==="linear"?n.jsxs("div",{className:"border-[1.5px] border-black p-1 bg-white leading-tight uppercase font-bold text-justify",style:{fontSize:l(6)},children:[n.jsx("strong",{children:h("INFORMACAO NUTRICIONAL:",o)})," ",h(`Porcao ${x}g;`,o)," ",v.map((s,S)=>n.jsxs("span",{children:[h(s.label,o),": ",D(s.val,s.unit),s.unit,S===v.length-1?".":"; "]},s.key)),n.jsx("br",{}),n.jsx("span",{style:{fontSize:l(5)},children:h("* % VD com base em dieta de 2.000 kcal.",o)})]}):i==="horizontal"?n.jsxs("div",{className:"border-[1.5px] border-black bg-white flex flex-col w-full h-full font-sans overflow-hidden",children:[n.jsx("div",{className:"border-b-[1.5px] border-black p-0.5 font-black uppercase text-center",style:{fontSize:l(7.5)},children:h("Informacao Nutricional",o)}),n.jsx("div",{className:"border-b border-black p-0.5 font-bold text-center",style:{fontSize:l(6)},children:h(`Porcao: ${x}g`,o)}),n.jsx("div",{className:"flex flex-wrap flex-1 overflow-hidden",children:v.map(s=>n.jsxs("div",{className:"border-r border-b border-black flex-[1_1_30%] p-0.5 flex flex-col items-center justify-center text-center last:border-r-0",children:[n.jsx("span",{style:{fontSize:l(5)},className:"font-bold leading-none uppercase",children:h(s.label,o)}),n.jsxs("span",{style:{fontSize:l(6.5)},className:"font-black",children:[D(s.val,s.unit),s.unit]})]},s.key))})]}):n.jsxs("div",{className:"border-[1.5px] border-black bg-white leading-none w-full text-black flex flex-col box-border font-sans h-full overflow-hidden",children:[n.jsx("div",{className:"border-b-[1.5px] border-black font-black uppercase text-left",style:{fontSize:l(8),padding:"2px 4px"},children:h("Informacao Nutricional",o)}),n.jsx("div",{className:"border-b-[1px] border-black font-bold",style:{fontSize:l(6.5),padding:"2px 4px"},children:h(`Porcao: ${x}g (1 unidade)`,o)}),n.jsxs("div",{className:"flex flex-col flex-1 overflow-hidden",children:[n.jsxs("div",{className:"flex border-b-[1px] border-black font-black uppercase bg-slate-50",style:{fontSize:l(6)},children:[n.jsx("div",{className:"flex-[3] border-r border-black px-1 py-0.5",children:h("Constituintes",o)}),n.jsx("div",{className:"flex-1 px-1 py-0.5 text-right",children:h("Qtd.",o)})]}),v.map(s=>n.jsxs("div",{className:"flex border-b border-black last:border-b-0 items-center",style:{fontSize:l(6.5)},children:[n.jsxs("div",{className:`flex-[3] border-r border-black px-1 py-0.5 ${s.indent?"italic font-normal pl-3":"font-bold uppercase"}`,children:[h(s.label,o)," ",`(${s.unit})`]}),n.jsx("div",{className:"flex-1 px-1 py-0.5 text-right font-black",children:D(s.val,s.unit)})]},s.key))]}),n.jsx("div",{className:"border-t-[1.5px] border-black font-bold text-justify",style:{fontSize:l(4.5),padding:"2px",lineHeight:"1.1"},children:h("* Valores diarios com base em uma dieta de 2.000 kcal.",o)})]})};function X({elements:t,setElements:e,isDesignMode:i,selectedId:o,setSelectedId:l,parseContent:a,labelRef:m,zoom:c=1,isPrintMode:f=!1}){const j=f||!i;return n.jsxs("div",{ref:m,className:F("bg-white relative shrink-0 overflow-hidden",i&&!f&&"shadow-2xl ring-1 ring-slate-200","print:shadow-none print:ring-0 print:m-0 print:p-0"),style:{width:"100%",height:"100%",boxSizing:"border-box",printColorAdjust:"exact",WebkitPrintColorAdjust:"exact"},onClick:r=>{j||r.target===r.currentTarget&&l(null)},children:[i&&!f&&n.jsx("div",{className:"absolute border border-dashed border-red-200 pointer-events-none z-[999]",style:{top:"2mm",left:"2mm",right:"2mm",bottom:"2mm"},children:n.jsx("span",{className:"absolute -top-3 left-0 text-[7px] text-red-400 font-black uppercase",children:"Área de Segurança (2mm)"})}),t.map(r=>{const p=o===r.id,g=a(r.content),y=typeof g=="object"&&g!==null,k=typeof r.content=="string"&&r.content.includes("TABELA_NUTRI_TEXTO"),x=i&&!f?7.5:0,v=(r.x||0)+x,D=(r.y||0)+x,s={position:"absolute",left:`${v}px`,top:`${D}px`,width:`${r.width}px`,height:`${r.height}px`,zIndex:i&&p?999:r.zIndex||10},S=()=>r.type==="image"?n.jsx("img",{src:r.content,className:"w-full h-full object-contain",alt:""}):y?n.jsx("div",{className:"w-full h-full bg-white p-1 overflow-hidden flex items-center justify-center",children:n.jsx(J,{data:g,fontSize:r.fontSize,target:"web"})}):n.jsx("div",{style:{fontSize:`${r.fontSize}px`,fontWeight:r.fontWeight||"bold",color:r.color||"black",backgroundColor:r.backgroundColor||"transparent",textAlign:r.textAlign||"left",display:"flex",alignItems:"flex-start",justifyContent:r.textAlign==="center"?"center":r.textAlign==="right"?"flex-end":"flex-start",width:"100%",height:"100%",lineHeight:k?"1.2":"1.1",whiteSpace:"pre-wrap",fontFamily:k?"monospace":"inherit",padding:r.type==="box"?0:"0 2px",overflow:"hidden",wordBreak:"break-word"},children:r.type!=="box"&&String(g||"")});return f?n.jsx("div",{style:s,className:"pointer-events-none",children:S()},r.id):i?n.jsx(M,{size:{width:r.width,height:r.height},position:{x:v,y:D},scale:c,bounds:"parent",enableResizing:p?{bottom:!0,bottomRight:!0,right:!0}:!1,className:F("flex items-center overflow-hidden transition-all",p?"ring-2 ring-emerald-500 bg-emerald-50/10 shadow-2xl":"hover:ring-1 hover:ring-slate-300"),style:{zIndex:s.zIndex,position:"absolute"},onDragStop:(z,d)=>e(b=>b.map(_=>_.id===r.id?{..._,x:d.x-x,y:d.y-x}:_)),onResizeStop:(z,d,b,_,L)=>e(E=>E.map(O=>O.id===r.id?{...O,width:parseInt(b.style.width),height:parseInt(b.style.height),x:L.x-x,y:L.y-x}:O)),onClick:z=>{z.stopPropagation(),l(r.id)},children:S()},r.id):n.jsx("div",{style:s,onClick:z=>{z.stopPropagation(),l(r.id)},className:F("cursor-pointer transition-all",p?"ring-2 ring-emerald-500 bg-emerald-50/10 shadow-lg z-[999]":"hover:ring-1 hover:ring-slate-300"),children:S()},r.id)})]})}function K(t){if(!t)return null;if(typeof t=="object")return t;try{return JSON.parse(t)}catch{return null}}function H(t){const e=[t.shippingAddress,t.shippingAddressNumber?`, ${t.shippingAddressNumber}`:""].join("").trim(),i=[t.shippingAddressComplement,t.shippingNeighborhood].filter(Boolean).join(" - "),o=[t.shippingCity,t.shippingState].filter(Boolean).join(" / ");return[e,i,o].filter(Boolean)}function Y({order:t}){var a,m;if(!t)return null;const e=V(t),i=e.paymentMethodName||"A DEFINIR",o=H(t),l=t.deliveryType==="pickup"||o.length===0;return n.jsxs("div",{className:"print-container",children:[n.jsx("style",{children:`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        .print-container {
          width: 80mm;
          max-width: 80mm;
          box-sizing: border-box;
          background: #fff;
          color: #000;
          font-family: "Courier New", Courier, monospace;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 auto;
          padding: 8mm 5mm 6mm;
        }

        .receipt-rule {
          border-top: 1px solid #000;
          margin: 8px 0;
          width: 100%;
        }

        .text-center { text-align: center; }
        .font-black { font-weight: 900 !important; }
        .uppercase { text-transform: uppercase; }

        .section-title {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin: 0 0 4px;
        }

        .block {
          border: 1px solid #000;
          padding: 6px;
          margin-top: 6px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: flex-start;
          margin: 3px 0;
        }
        .row-label {
          flex: 1;
          min-width: 0;
          padding-right: 6px;
          word-break: break-word;
        }
        .row-value {
          white-space: nowrap;
          text-align: right;
        }

        .item {
          margin-bottom: 12px;
        }
        .item-title {
          font-size: 14px;
          font-weight: 900;
          margin: 0 0 3px;
        }
        .item-detail {
          padding-left: 12px;
          font-size: 12px;
          margin: 2px 0 0;
        }

        .total-row {
          font-size: 17px;
          font-weight: 900;
          border-top: 2px solid #000;
          padding-top: 6px;
          margin-top: 6px;
        }

        .badge {
          display: inline-block;
          border: 2px solid #000;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 900;
          margin-top: 4px;
        }

        .obs-block {
          border: 2px dashed #000;
          padding: 8px;
          margin-top: 6px;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
        }
      `}),n.jsxs("div",{className:"text-center",children:[n.jsx("h1",{style:{fontSize:"20px",margin:0,fontWeight:900},children:"GOURMET SAUDAVEL"}),n.jsx("div",{className:"badge",children:"CUPOM NAO FISCAL"}),n.jsxs("p",{style:{fontSize:"15px",margin:"6px 0 0",fontWeight:900},children:["PEDIDO #",String(t.id).slice(-6).toUpperCase()]})]}),n.jsx("div",{className:"receipt-rule"}),n.jsxs("div",{children:[n.jsx("p",{className:"section-title uppercase",children:"Cliente"}),n.jsxs("div",{className:"block",children:[n.jsx("div",{className:"font-black uppercase",children:t.customerName}),t.customerPhone?n.jsxs("div",{children:["TEL: ",t.customerPhone]}):null]})]}),n.jsxs("div",{children:[n.jsx("p",{className:"section-title uppercase",style:{marginTop:8},children:l?"Retirada":"Entrega"}),n.jsx("div",{className:"block",children:l?n.jsx("div",{className:"font-black uppercase",children:"Retirada na loja"}):o.map(c=>n.jsx("div",{className:"uppercase",children:c},c))})]}),n.jsx("div",{className:"receipt-rule"}),n.jsx("p",{className:"text-center font-black uppercase",style:{fontSize:"12px",margin:0},children:"Resumo do pedido"}),n.jsx("div",{style:{marginTop:"10px"},children:(a=t.items)==null?void 0:a.map((c,f)=>{const u=K(c.parsedOptions||c.options)||{},A=c.packageItems||u.meals||[],j=A.length>0;return n.jsxs("div",{className:"item",children:[n.jsxs("div",{className:"item-title",children:[c.quantity,"x ",c.name||c.dishName,(u.sizeName||u.selectedSizeName)&&` [${u.sizeName||u.selectedSizeName}]`]}),j&&A.map((r,p)=>n.jsxs("div",{className:"item-detail",children:[n.jsxs("strong",{className:"font-black",children:["- ",r.label||r.slotName,":"]})," ",String(r.dishName).toUpperCase(),(r.accompaniments||r.selectedAccompaniments||[]).map((g,y)=>n.jsxs("div",{className:"item-detail",children:["+ ",g.name," ",g.weight?`(${g.weight}g)`:""]},y))]},p)),!j&&(u.selectedAccs||u.selectedAccompaniments||[]).map((r,p)=>n.jsxs("div",{className:"item-detail",children:["- ",r.name," ",r.weight?`(${r.weight}g)`:""]},p))]},f)})}),n.jsx("div",{className:"receipt-rule"}),n.jsxs("div",{style:{fontSize:"13px",fontWeight:900},children:[n.jsxs("div",{className:"row",children:[n.jsx("span",{className:"row-label",children:"SUBTOTAL"}),n.jsx("span",{className:"row-value",children:I(e.subtotal)})]}),n.jsxs("div",{className:"row",children:[n.jsx("span",{className:"row-label",children:l?"RETIRADA":"FRETE"}),n.jsx("span",{className:"row-value",children:I(e.shippingCost)})]}),e.discountLines.length>0&&n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"receipt-rule"}),e.discountLines.map(c=>n.jsxs("div",{className:"row",children:[n.jsx("span",{className:"row-label uppercase",children:c.label}),n.jsxs("span",{className:"row-value",children:["-",I(c.amount)]})]},`${c.key}-${c.label}`))]}),n.jsxs("div",{className:"row total-row",children:[n.jsx("span",{className:"row-label",children:"TOTAL"}),n.jsx("span",{className:"row-value",children:I(e.total)})]})]}),n.jsxs("div",{className:"block text-center",style:{marginTop:"12px",borderWidth:"2px"},children:[n.jsx("p",{className:"font-black",style:{fontSize:"11px",margin:0},children:"FORMA DE PAGAMENTO"}),n.jsx("p",{className:"font-black uppercase",style:{fontSize:"17px",margin:"4px 0 0"},children:i})]}),((m=t.notes)==null?void 0:m.trim())&&n.jsxs("div",{style:{marginTop:"12px"},children:[n.jsx("p",{className:"section-title uppercase",children:"Observacoes do cliente"}),n.jsx("div",{className:"obs-block",children:t.notes.trim()})]}),n.jsxs("div",{className:"text-center font-black",style:{marginTop:"16px",fontSize:"11px"},children:[n.jsx("p",{style:{fontSize:"13px",margin:0},children:"Obrigado pelo pedido!"}),n.jsx("p",{children:new Date().toLocaleString("pt-BR")}),n.jsx("div",{style:{height:"20px"}})]})]})}export{X as L,Y as O,I as f,V as g,P as s};
