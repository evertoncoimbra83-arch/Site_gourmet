import { protectedProcedure } from "../../../../../server/_core/trpc.js";
import { getDb } from "../../../../../server/db.js";
import { 
  nutriProfiles, 
  users,
  prescriptions
} from "../../../../../drizzle/schema/index.js"; 
import { eq, desc, inArray } from "drizzle-orm"; 
import { decrypt } from "../../../../../server/encryption.js";
import { TRPCError } from "@trpc/server";

export const clientProcedures = {
  /**
   * Obtém a lista de pacientes vinculados ao nutricionista logado
   * Retorna até as últimas prescrições para preencher os slots da UI.
   */
  getMyClients: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      
      // 1. Busca o perfil do nutricionista
      const profile = await db.query.nutriProfiles.findFirst({
        where: eq(nutriProfiles.userId, ctx.user.id)
      });
      
      if (!profile?.referralCode) return [];

      const nutriCode = profile.referralCode.trim();

      // 2. Busca os pacientes vinculados
      const clientRows = await db.query.users.findMany({
        where: eq(users.referralCode, nutriCode),
      });

      if (!clientRows.length) return [];

      const clientIds = clientRows.map(c => c.id);

      // 3. Busca TODAS as prescrições (Sem limitar a 1 por cliente no SQL)
      // ✅ IMPORTANTE: Verifique se no seu schema a coluna é 'clientId' ou 'userId'
      const allPrescriptions = await db
        .select({
          id: prescriptions.id,
          clientId: prescriptions.clientId, // Se o filtro falhar, troque para prescriptions.userId
          planName: prescriptions.planName,
          totalKcalTarget: prescriptions.totalKcalTarget,
          createdAt: prescriptions.createdAt,
          status: prescriptions.status,
        })
        .from(prescriptions)
        .where(inArray(prescriptions.clientId, clientIds))
        .orderBy(desc(prescriptions.createdAt));

      // 4. Montagem do objeto enriquecido
      return clientRows.map((row) => {
        let clientDisplayName = "Paciente";
        
        try {
          const decryptedName = decrypt(row.name);
          clientDisplayName = decryptedName || row.email.split('@')[0];
        } catch { 
          clientDisplayName = row.email?.split('@')[0] || "Usuário";
        }

        // ✅ Filtro robusto: garante que estamos comparando strings
        const clientPrescriptions = allPrescriptions
          .filter(p => String(p.clientId) === String(row.id))
          .slice(0, 4); // Otimização: envia apenas o necessário para os 4 slots

        return {
          id: row.id, // ID para a key do map no front
          client: { 
            id: row.id,
            name: clientDisplayName, 
            email: row.email 
          },
          prescriptions: clientPrescriptions // Array de dietas
        };
      });

    } catch (error: unknown) { 
       const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
       console.error("🔴 ERRO getMyClients:", errorMessage);
       
       throw new TRPCError({ 
         code: "INTERNAL_SERVER_ERROR", 
         message: "Erro ao buscar lista de pacientes." 
       });
    }
  }),
};