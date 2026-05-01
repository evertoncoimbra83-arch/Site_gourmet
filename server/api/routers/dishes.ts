import { and, asc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { accompanimentOptions, dishes } from "../../../drizzle/schema/index.js";
import { getDb } from "../../../server/db";
import { internalProcedure, publicProcedure, router } from "../../_core/trpc.js";

interface ApiRequestLike {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | undefined>;
}

interface ApiResponseLike {
  status: (code: number) => {
    json: (payload: unknown) => unknown;
  };
}

const listInputSchema = z
  .object({
    page: z.number().default(1),
    perPage: z.number().default(100),
    search: z.string().nullish(),
    category: z.union([z.number(), z.string()]).nullish(),
  })
  .optional();

async function getInventoryData() {
  const db = await getDb();

  const [allDishes, allAccompaniments] = await Promise.all([
    db.query.dishes.findMany({
      with: {
        category: true,
        composition: {
          with: {
            ingredient: true,
            accompanimentOption: true,
          },
        },
      },
      where: eq(dishes.isActive, true),
    }),
    db.query.accompanimentOptions.findMany({
      where: eq(accompanimentOptions.isActive, true),
    }),
  ]);

  return {
    timestamp: new Date().toISOString(),
    dishes: allDishes,
    accompaniments: allAccompaniments,
  };
}

async function listPublicDishes(input?: {
  page?: number;
  perPage?: number;
  search?: string | null | undefined;
  category?: string | number | null | undefined;
}) {
  const db = await getDb();
  const page = input?.page || 1;
  const perPage = input?.perPage || 100;
  const offset = (page - 1) * perPage;
  const conditions = [eq(dishes.isActive, true)];

  if (input?.search) {
    conditions.push(like(dishes.name, `%${input.search}%`));
  }

  if (input?.category && input.category !== "all") {
    const categoryId = Number(input.category);
    if (!Number.isNaN(categoryId)) {
      conditions.push(eq(dishes.categoryId, categoryId));
    }
  }

  return db
    .select()
    .from(dishes)
    .where(and(...conditions))
    .orderBy(asc(dishes.displayOrder))
    .limit(perPage)
    .offset(offset);
}

export const dishesRouter = router({
  list: publicProcedure.input(listInputSchema).query(async ({ input }) => {
    return listPublicDishes(input);
  }),
  getInventory: internalProcedure.query(async () => {
    return getInventoryData();
  }),
});

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method === "GET" && req.query.mode === "list") {
    try {
      const page = Number(req.query.page || 1);
      const perPage = Number(req.query.perPage || 100);
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const category =
        typeof req.query.category === "string" ? req.query.category : undefined;

      const payload = await listPublicDishes({ page, perPage, search, category });
      return res.status(200).json(payload);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      return res.status(500).json({
        error: "Internal Server Error",
        detail: msg,
      });
    }
  }

  const authorization = req.headers.authorization;
  const token = process.env.INTERNAL_INTEGRATION_TOKEN;

  if (!token || authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = await getInventoryData();
    return res.status(200).json(payload);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na API de pratos:", msg);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: msg,
    });
  }
}
