import { router } from "../../../../server/_core/trpc.js";

// ✅ Importações Locais (mesma pasta: /accompaniments)
import { accompanimentCategoriesRouter } from "./categories.js"; 

// ✅ Importações de Nível Superior (pasta: /admin)
// Verifique se estes arquivos estão realmente em /server/routers/admin/
import { adminSizesRouter } from "../sizes.js"; 
import { adminGroupsRouter } from "../groups.js";
import { adminOptionsRouter } from "./options.js";

/**
 * 🥗 HUB DE ACOMPANHAMENTOS
 * trpc.admin.accompaniments.[procedimento]
 */
export const adminAccompanimentsRouter = router({
  // ✅ Rotas organizadas
  categories: accompanimentCategoriesRouter, 
  options: adminOptionsRouter,
  groups: adminGroupsRouter,
  dishSizes: adminSizesRouter,
});