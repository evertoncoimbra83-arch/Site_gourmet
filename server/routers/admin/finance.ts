import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js"; 

import * as Coupon from "../../coupon.js";
import * as AdminPaymentMethods from "../../admin-payment-methods.js";
import * as AdminReports from "../../admin-reports.js";
import * as MediaLibrary from "../../media-library.js";

// --- TIPAGEM DE INFERÊNCIA ---
type CouponCreateInput = Parameters<typeof Coupon.createCoupon>[0];
type CouponUpdateInput = Parameters<typeof Coupon.updateCoupon>[1];
type PaymentCreateInput = Parameters<typeof AdminPaymentMethods.createPaymentMethod>[0];
type PaymentUpdateInput = Parameters<typeof AdminPaymentMethods.updatePaymentMethod>[1];

/**
 * 🎫 Roteador de Cupons
 */
const adminCouponsRouter = router({
    list: adminProcedure.query(async () => await Coupon.listCoupons()),
    
    create: adminProcedure
        .input(z.object({ 
            code: z.string().min(1).toUpperCase(), 
            description: z.string().nullish(), 
            discountType: z.enum(["percentage", "fixed"]), 
            discount_value: z.number().positive(), 
            minOrderValue: z.number().nullish(), 
            maxDiscount: z.number().nullish(), 
            usageLimit: z.number().int().nullish(), 
            validFrom: z.coerce.date().nullish(), 
            validUntil: z.coerce.date().nullish(),
            isActive: z.boolean().optional().default(true),
        }))
        .mutation(async ({ input }) => {
            const { discount_value, ...rest } = input;
            
            // ✅ Mapeamento de discount_value -> discountValue para bater com o serviço
            const payload: CouponCreateInput = {
                ...rest,
                discountValue: discount_value
            };

            const result = await Coupon.createCoupon(payload);
            
            return {
                success: true,
                data: result,
                message: `Cupom "${input.code}" criado com sucesso!`
            };
        }),
    
    update: adminProcedure
        .input(z.object({ 
            id: z.union([z.string(), z.number()]), 
            code: z.string().optional(),
            isActive: z.boolean().optional() 
        }).passthrough())
        .mutation(async ({ input }) => { 
            const { id, ...data } = input; 
            // ✅ CORREÇÃO TS2345: Garantindo que o ID seja string para o serviço
            const stringId = String(id);
            
            const result = await Coupon.updateCoupon(stringId, data as CouponUpdateInput); 
            
            return {
                success: true,
                data: result,
                message: `Configurações do cupom ${input.code || ''} atualizadas!`
            };
        }),
    
    delete: adminProcedure
        .input(z.object({ id: z.union([z.string(), z.number()]), code: z.string().optional() })) 
        .mutation(async ({ input }) => {
            // ✅ CORREÇÃO TS2345: ID convertido para string
            const stringId = String(input.id);
            await Coupon.deleteCoupon(stringId); 
            
            return {
                success: true,
                message: input.code ? `Cupom "${input.code}" removido.` : "Cupom excluído com sucesso."
            };
        }),
});

/**
 * 💳 Roteador de Métodos de Pagamento
 */
const adminPaymentMethodsRouter = router({
    listAll: adminProcedure.query(async () => await AdminPaymentMethods.listAllPaymentMethods()),
    
    create: adminProcedure
        .input(z.object({ 
            name: z.string(), 
            type: z.enum(["card", "cash", "meal_card", "pix"]), 
        }).passthrough())
        .mutation(async ({ input }) => {
            const result = await AdminPaymentMethods.createPaymentMethod(input as PaymentCreateInput);
            return {
                success: true,
                data: result,
                message: `Método de pagamento "${input.name}" adicionado!`
            };
        }),

    update: adminProcedure
        .input(z.object({ 
            id: z.union([z.string(), z.number()]), 
            name: z.string().optional(), 
            isActive: z.boolean().optional(), 
        }).passthrough())
        .mutation(async ({ input }) => { 
            const { id, ...data } = input; 
            // ✅ CORREÇÃO TS2345: ID convertido para string
            const stringId = String(id);
            await AdminPaymentMethods.updatePaymentMethod(stringId, data as PaymentUpdateInput); 
            
            return {
                success: true,
                message: `Forma de pagamento "${input.name || ''}" atualizada.`
            };
        }),
});

/**
 * 📊 Roteador de Relatórios
 */
const adminReportsRouter = router({
    getDashboardSummary: adminProcedure
        .input(z.object({ timeframe: z.enum(["day", "week", "month"]) }))
        .query(async ({ input }) => await AdminReports.getDashboardSummary(input.timeframe)),
        
    getPaymentMethodReport: adminProcedure
        .input(z.object({ 
            startDate: z.coerce.date(), 
            endDate: z.coerce.date() 
        }))
        .query(async ({ input }) => await AdminReports.getPaymentMethodReport(input.startDate, input.endDate)),
});

/**
 * 🖼️ Roteador de Mídia
 */
const adminMediaRouter = router({
    list: adminProcedure.query(async () => await MediaLibrary.listMediaLibrary()),
    
    upload: adminProcedure
        .input(z.object({ filename: z.string(), mimeType: z.string(), base64Data: z.string() }))
        .mutation(async ({ input, ctx }) => { 
            const fileBuffer = Buffer.from(input.base64Data, "base64"); 
            const authorId = ctx.user?.id || "system"; 

            const result = await MediaLibrary.uploadImage({ 
                file: fileBuffer, 
                originalFilename: input.filename, 
                mimeType: input.mimeType, 
                uploadedBy: authorId, 
                fileSize: fileBuffer.length 
            }); 

            return {
                success: true,
                data: result,
                message: `Upload de "${input.filename}" concluído!`
            };
        }),
});

/**
 * 🚀 Exportação Principal (Financeiro)
 */
export const adminFinanceRouter = router({
    coupons: adminCouponsRouter,
    payments: adminPaymentMethodsRouter,
    reports: adminReportsRouter,
    media: adminMediaRouter,
});