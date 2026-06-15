import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Sprint Alertas P2 Validation", () => {
  it("garante que nenhum arquivo em client/src chame alert(), confirm() ou prompt() nativo", () => {
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

      // Remove comments (single line and multi line) to avoid false positives on comments
      const cleanContent = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*/g, "");

      const confirmMatch = cleanContent.match(/\b(window\.)?confirm\s*\(/);
      const alertMatch = cleanContent.match(/\b(window\.)?alert\s*\(/);
      const promptMatch = cleanContent.match(/\b(window\.)?prompt\s*\(/);

      const relativePath = path.relative(projectRoot, file);

      expect(confirmMatch, `Arquivo ${relativePath} contém chamada nativa para confirm()`).toBeNull();
      expect(alertMatch, `Arquivo ${relativePath} contém chamada nativa para alert()`).toBeNull();
      expect(promptMatch, `Arquivo ${relativePath} contém chamada nativa para prompt()`).toBeNull();
    });
  });

  it("garante que o ConfirmDialog possui validações de trim() e limpeza de estados", () => {
    const source = readProjectFile("client/src/components/ui/ConfirmDialog.tsx");

    // Validação de justificativa com trim().length >= 8
    expect(source).toContain("trim().length >= 8");

    // Limpeza de campos ao abrir/fechar/concluir
    expect(source).toContain("setConfirmText(\"\")");
    expect(source).toContain("setReasonText(\"\")");

    // Bloqueio de cancelar/confirmar se em loading
    expect(source).toContain("if (loading) return");
  });
});
