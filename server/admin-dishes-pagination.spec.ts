import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_DISHES_MAX_PAGE_SIZE,
  normalizeAdminDishesListParams,
} from "./admin-dishes/logic/admin-dishes-types";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Admin Dishes pagination contract", () => {
  it("normaliza pagina inicial e pageSize padrao", () => {
    const params = normalizeAdminDishesListParams({});

    expect(params.page).toBe(1);
    expect(params.limit).toBe(50);
    expect(params.status).toBe("active");
  });

  it("respeita pageSize maximo", () => {
    const params = normalizeAdminDishesListParams({ page: 2, pageSize: 999 });

    expect(params.page).toBe(2);
    expect(params.limit).toBe(ADMIN_DISHES_MAX_PAGE_SIZE);
  });

  it("mantem showInactive legado como status all", () => {
    const params = normalizeAdminDishesListParams({ showInactive: true });

    expect(params.status).toBe("all");
    expect(params.showInactive).toBe(true);
  });

  it("aplica status inactive explicitamente", () => {
    const params = normalizeAdminDishesListParams({ status: "inactive" });

    expect(params.status).toBe("inactive");
    expect(params.showInactive).toBe(false);
  });

  it("limpa busca e preserva categoryId", () => {
    const params = normalizeAdminDishesListParams({
      search: "  Tilapia  ",
      categoryId: 7,
    });

    expect(params.search).toBe("Tilapia");
    expect(params.categoryId).toBe(7);
  });

  it("backend retorna metadados sem quebrar data legado", () => {
    const source = readProjectFile(
      "server/admin-dishes/logic/admin-dishes-queries.ts",
    );

    expect(source).toContain("data: dataWithSizes");
    expect(source).toContain("items: dataWithSizes");
    expect(source).toContain("totalPages");
    expect(source).toContain("pageSize: params.limit");
  });

  it("frontend usa paginacao de servidor e nao slice local", () => {
    const source = readProjectFile("client/src/pages/AdminDishes.tsx");

    expect(source).toContain("Mostrando ${firstVisible}-${lastVisible} de ${totalDishes} pratos");
    expect(source).toContain("actions.setPage(currentPage + 1)");
    expect(source).toContain("actions.setPage(currentPage - 1)");
    expect(source).toContain("actions.setPageSize(Number(event.target.value))");
    expect(source).not.toContain(".slice(");
  });

  it("busca e filtros resetam para pagina 1 no hook", () => {
    const source = readProjectFile(
      "client/src/pages/adminDishes/logic/useAdminDishes.ts",
    );

    expect(source).toContain("setPage(1)");
    expect(source).toContain("[search, selectedCategory, showInactive, pageSize]");
    expect(source).toContain('status: showInactive ? "all" : "active"');
    expect(source).toContain("pageSize");
  });
});
