import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js"; 
import { TRPCError } from "@trpc/server";

import * as Coupon from "../../coupon.js";
import * as AdminPaymentMethods from "../../admin-payment-methods.js";
import * as AdminReports from "../../admin-reports.js";
import * as MediaLibrary from "../../media-library.js";

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
        .mutation(async ({ input }) => await Coupon.createCoupon(input as any)),
    
    update: adminProcedure
        .input(z.object({ 
            id: z.union([z.string(), z.number()]), 
            code: z.string().optional(),
            description: z.string().nullish(), 
            discountType: z.enum(["percentage", "fixed"]).optional(), 
            discount_value: z.number().optional(), 
            minOrderValue: z.number().nullish(), 
            maxDiscount: z.number().nullish(), 
            usageLimit: z.number().int().nullish(), 
            validFrom: z.coerce.date().nullish(), 
            validUntil: z.coerce.date().nullish(), 
            isActive: z.boolean().optional() 
        }))
        .mutation(async ({ input }) => { 
            const { id, ...data } = input; 
            const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
            return await Coupon.updateCoupon(numericId as any, data as any); 
        }),
    
    delete: adminProcedure
        .input(z.object({ id: z.union([z.string(), z.number()]) })) 
        .mutation(async ({ input }) => {
            const numericId = typeof input.id === 'string' ? parseInt(input.id, 10) : input.id;
            return await Coupon.deleteCoupon(numericId as any);
        }),
});

const adminPaymentMethodsRouter = router({
    listAll: adminProcedure.query(async () => await AdminPaymentMethods.listAllPaymentMethods()),
    
    create: adminProcedure
        .input(z.object({ 
            name: z.string(), 
            type: z.enum(["card", "cash", "meal_card", "pix"]), 
            minAmount: z.number().optional().default(0), 
            displayOrder: z.number().optional().default(0), 
            isActive: z.boolean().optional().default(true), 
            description: z.string().optional(), 
            brandName: z.string().optional(), 
            brandLogoUrl: z.string().optional(), 
            discountPercentage: z.number().optional().default(0) 
        }))
        .mutation(async ({ input }) => await AdminPaymentMethods.createPaymentMethod(input as any)),

    update: adminProcedure
        .input(z.object({ 
            id: z.union([z.string(), z.number()]), 
            name: z.string().optional(), 
            isActive: z.boolean().optional(), 
            discountPercentage: z.number().optional() 
        }))
        .mutation(async ({ input }) => { 
            const { id, ...data } = input; 
            const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
            return await AdminPaymentMethods.updatePaymentMethod(numericId as any, data as any); 
        }),
});

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

const adminMediaRouter = router({
    list: adminProcedure.query(async () => await MediaLibrary.listMediaLibrary()),
    
    upload: adminProcedure
        .input(z.object({ filename: z.string(), mimeType: z.string(), base64Data: z.string() }))
        .mutation(async ({ input, ctx }) => { 
            const fileBuffer = Buffer.from(input.base64Data, "base64"); 
            
            // ✅ REMOVIDO userIdLegacy: Usamos apenas o id da sessão Lucia.
            // Se o MediaLibrary ainda exigir um número, usamos o hash ou 0 temporariamente.
            // O ideal é que o MediaLibrary aceite string (UUID).
            const authorId = ctx.user?.id || "system"; 

            return await MediaLibrary.uploadImage({ 
                file: fileBuffer, 
                originalFilename: input.filename, 
                mimeType: input.mimeType, 
                uploadedBy: authorId as any, 
                fileSize: fileBuffer.length 
            }); 
        }),
});

export const adminFinanceRouter = router({
    coupons: adminCouponsRouter,
    payments: adminPaymentMethodsRouter,
    reports: adminReportsRouter,
    media: adminMediaRouter,
});