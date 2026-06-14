import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Sprint Mídia P1 Validation", () => {
  it("garante que nenhum arquivo em client/src importa ou faz referência a MediaPickerModal", () => {
    const clientDir = path.join(projectRoot, "client/src");

    function walkDir(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walkDir(filePath));
        } else if (/\.(ts|tsx)$/.test(file)) {
          results.push(filePath);
        }
      });
      return results;
    }

    const files = walkDir(clientDir);

    files.forEach((file) => {
      const content = readProjectFile(path.relative(projectRoot, file));
      const relativePath = path.relative(projectRoot, file);

      expect(content).not.toContain("MediaPickerModal");
    });
  });

  it("garante que o arquivo client/src/components/MediaPickerModal.tsx foi excluído", () => {
    const filePath = path.join(projectRoot, "client/src/components/MediaPickerModal.tsx");
    const exists = fs.existsSync(filePath);
    expect(exists).toBe(false);
  });

  it("garante que o MediaLibraryDrawer aceita initialFolder e tem barra de busca", () => {
    const source = readProjectFile("client/src/pages/adminMedia/view/MediaLibraryDrawer.tsx");

    // Deve aceitar a propriedade initialFolder
    expect(source).toContain("initialFolder?: string");

    // Deve ter suporte a busca/filtro de imagem (search ou similar)
    const searchMatch = source.toLowerCase().includes("search") || source.toLowerCase().includes("busca") || source.includes("find") || source.includes("filter");
    expect(searchMatch).toBe(true);

    // Deve passar url e objeto de mídia no onSelect
    expect(source).toContain("onSelect: (url: string");
  });

  it("garante que o MediaLibraryDrawer possui z-index customizado de sobreposição", () => {
    const source = readProjectFile("client/src/pages/adminMedia/view/MediaLibraryDrawer.tsx");

    // Deve possuir o z-index de conteúdo z-[130] e overlay z-[120]
    expect(source).toContain("className=\"flex h-screen w-full flex-col border-none bg-slate-50 p-0 outline-none sm:max-w-3xl z-[130]\"");
    expect(source).toContain("overlayClassName=\"z-[120]\"");
  });

  it("garante que o SheetContent do ui/sheet.tsx suporta a propriedade overlayClassName", () => {
    const source = readProjectFile("client/src/components/ui/sheet.tsx");

    expect(source).toContain("overlayClassName?: string");
    expect(source).toContain("overlayClassName, ...props");
    expect(source).toContain("<SheetOverlay className={overlayClassName} />");
  });
});
