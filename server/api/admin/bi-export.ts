import type { Request, Response } from "express";
import { z } from "zod";
import { adminProcedure, router } from "../../_core/trpc.js";
import { getHistoricalOrdersForBI } from "../../logic/bi-exporter";

export async function handleBIExport(req: Request, res: Response) {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "Datas de inicio e fim sao obrigatorias.",
      });
    }

    const data = await getHistoricalOrdersForBI(start as string, end as string);

    res.setHeader(
      "Content-disposition",
      `attachment; filename=export-bi-${start}.json`
    );
    res.setHeader("Content-type", "application/json");

    return res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erro na exportacao BI:", err);
    return res.status(500).json({
      error: "Erro ao gerar exportacao.",
      details: err instanceof Error ? err.message : "Erro desconhecido",
    });
  }
}

export const biExportRouter = router({
  run: adminProcedure
    .input(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getHistoricalOrdersForBI(input.start, input.end);
    }),
});
