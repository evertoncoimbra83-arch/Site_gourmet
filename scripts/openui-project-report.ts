/**
 * SCRIPT UTILITÁRIO - GERADOR DE RELATÓRIO DO PROJETO
 *
 * ATENÇÃO:
 * - Este script lê a estrutura do diretório local para gerar relatórios locais.
 * - Ele ignora arquivos .env de forma segura e não se conecta a bancos de dados.
 */

// ARQUIVO: scripts/generate-project-report.ts

import fs from "fs";
import path from "path";

/**
 * @types/node is required for this script to access 'process'.
 */
declare const process: {
  cwd: () => string;
  env: Record<string, string | undefined>;
  exit: (code?: number) => never;
};

const ROOT = process.cwd();

type ReportMode = "full" | "security" | "frontend" | "backend";
const REPORT_MODE = (process.env.REPORT_MODE || "full") as ReportMode;
const SAVE_HISTORY = process.env.REPORT_HISTORY === "1";

const DIRS_BY_MODE: Record<ReportMode, string[]> = {
  full: ["server", "client/src", "drizzle", "scripts"],
  security: [
    "server",
    "client/src/_core",
    "client/src/lib",
    "client/src/pages/checkout",
    "client/src/pages/cart",
    "drizzle",
  ],
  frontend: ["client/src"],
  backend: ["server", "drizzle"],
};

const INCLUDE_DIRS = DIRS_BY_MODE[REPORT_MODE] ?? DIRS_BY_MODE.full;

const ROOT_FILES = [
  "package.json",
  "tsconfig.json",
  "drizzle.config.ts",
  "vite.config.ts",
  "tailwind.config.ts",
  ".env.example",
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".vercel",
]);

const IGNORE_FILES = new Set([
  "project-report.json",
  "project-report.md",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
]);

const IGNORE_EXTS = new Set([
  ".avif",
  ".bmp",
  ".csv",
  ".eot",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".rar",
  ".svg",
  ".ttf",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

const INCLUDE_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".sql",
  ".prisma",
  ".css",
  ".md",
]);

const MAX_FILE_KB = 300;

interface FileEntry {
  path: string;
  content: string | null;
  sizeKB: number;
  language: string;
}

interface SecurityHint {
  file: string;
  issue: string;
}

interface ReportSummary {
  mode: ReportMode;
  totalEntries: number;
  totalFilesWithContent: number;
  omittedLargeFiles: number;
  criticalFiles: string[];
  securityHints: SecurityHint[];
  generatedAt: string;
}

interface ReportStructure {
  timestamp: string;
  root: string;
  summary: ReportSummary;
  tree: string[];
  files: FileEntry[];
}

type Entry = { type: "dir" | "file"; path: string };

function warnReadFailure(scope: string, error: unknown) {
  const reason = error instanceof Error ? error.message : "erro desconhecido";
  console.warn(`[project-report] Nao foi possivel ler ${scope}: ${reason}`);
}

function isIgnoredDir(name: string) {
  return IGNORE_DIRS.has(name);
}

function isEnvFile(filePath: string) {
  const fileName = path.basename(filePath);
  return fileName === ".env" || fileName.startsWith(".env.");
}

function isAllowedEnvFile(filePath: string) {
  return path.basename(filePath) === ".env.example";
}

function isIgnoredFile(filePath: string) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (IGNORE_FILES.has(fileName)) return true;
  if (isEnvFile(filePath) && !isAllowedEnvFile(filePath)) return true;
  return IGNORE_EXTS.has(ext);
}

function walkDir(startDir: string) {
  const result: Entry[] = [];
  if (!fs.existsSync(startDir)) return result;

  function walk(current: string) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        const relPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (entry.name.startsWith(".") || isIgnoredDir(entry.name)) continue;
          result.push({ type: "dir", path: relPath });
          walk(fullPath);
          continue;
        }

        if (isIgnoredFile(relPath)) continue;
        result.push({ type: "file", path: relPath });
      }
    } catch (error: unknown) {
      warnReadFailure(path.relative(ROOT, current).replace(/\\/g, "/"), error);
    }
  }

  walk(startDir);
  return result;
}

function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (isAllowedEnvFile(filePath)) return "bash";

  switch (ext) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
      return "javascript";
    case ".json":
      return "json";
    case ".sql":
      return "sql";
    case ".prisma":
      return "prisma";
    case ".css":
      return "css";
    case ".html":
      return "html";
    case ".md":
      return "markdown";
    default:
      return "txt";
  }
}

function shouldIncludeContent(filePath: string): boolean {
  if (isIgnoredFile(filePath)) return false;
  if (isAllowedEnvFile(filePath)) return true;

  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  return INCLUDE_EXTS.has(ext) || ROOT_FILES.includes(fileName);
}

function isCriticalFile(filePath: string) {
  const p = filePath.toLowerCase();
  return [
    "checkout",
    "cart",
    "auth",
    "payment",
    "coupon",
    "loyalty",
    "shipping",
    "upload",
    "media",
    "admin",
    "security",
    "middleware",
    "trpc",
    "order",
    "user",
    "address",
  ].some(term => p.includes(term));
}

function collectSecurityHints(
  filePath: string,
  content: string
): SecurityHint[] {
  const hints: SecurityHint[] = [];
  const isSafeParseHelper =
    filePath.replace(/\\/g, "/") === "server/lib/safe-parse.ts";

  const checks: Array<[RegExp, string]> = [
    [/\bas any\b/g, "usa 'as any'"],
    [/\bunknown as\b/g, "usa 'unknown as'"],
    [/\beval\s*\(/g, "usa eval()"],
    [
      /localStorage\.setItem\s*\(\s*["'`](token|auth|session)/gi,
      "possivel token/session em localStorage",
    ],
    [/JSON\.parse\s*\(/g, "usa JSON.parse; verificar try/catch"],
    [/dangerouslySetInnerHTML/g, "usa dangerouslySetInnerHTML"],
    [/innerHTML\s*=/g, "atribui innerHTML diretamente"],
    [/Number\s*\([^)]*\)\s*\|\|\s*0/g, "conversao Number(...) || 0 fragil"],
    [/parseFloat\s*\(/g, "usa parseFloat; validar entrada"],
    [/parseInt\s*\(/g, "usa parseInt; validar entrada"],
  ];

  for (const [regex, issue] of checks) {
    if (isSafeParseHelper && issue === "usa JSON.parse; verificar try/catch") {
      continue;
    }
    if (regex.test(content)) {
      hints.push({ file: filePath, issue });
    }
  }

  return hints;
}

function generateReportData(): ReportStructure {
  let allEntries: Entry[] = [];
  let omittedLargeFiles = 0;
  const generatedAt = new Date().toISOString();
  const securityHints: SecurityHint[] = [];

  for (const file of ROOT_FILES) {
    if (isIgnoredFile(file)) continue;
    if (fs.existsSync(path.join(ROOT, file))) {
      allEntries.push({ type: "file", path: file });
    }
  }

  for (const dir of INCLUDE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    allEntries = allEntries.concat(walkDir(abs));
  }

  const seen = new Set<string>();
  allEntries = allEntries.filter(entry => {
    const key = `${entry.type}:${entry.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const treeLines = allEntries.map(entry => entry.path).sort();
  const filesContent: FileEntry[] = [];

  for (const entry of allEntries) {
    if (entry.type !== "file") continue;

    const relPath = entry.path;
    if (!shouldIncludeContent(relPath)) continue;

    const absPath = path.join(ROOT, relPath);

    try {
      const stats = fs.statSync(absPath);
      const sizeKB = stats.size / 1024;
      const normalizedSizeKB = Number(sizeKB.toFixed(2));

      if (sizeKB > MAX_FILE_KB) {
        omittedLargeFiles += 1;
        filesContent.push({
          path: relPath,
          content: `[CONTEUDO OMITIDO: arquivo muito grande (${normalizedSizeKB} KB)]`,
          sizeKB: normalizedSizeKB,
          language: getLanguage(relPath),
        });
        continue;
      }

      const content = fs.readFileSync(absPath, "utf8").replace(/\0/g, "");
      securityHints.push(...collectSecurityHints(relPath, content));

      filesContent.push({
        path: relPath,
        content,
        sizeKB: normalizedSizeKB,
        language: getLanguage(relPath),
      });
    } catch (error: unknown) {
      warnReadFailure(relPath, error);
    }
  }

  const criticalFiles = filesContent
    .map(file => file.path)
    .filter(isCriticalFile)
    .sort();

  return {
    timestamp: generatedAt,
    root: ROOT,
    summary: {
      mode: REPORT_MODE,
      totalEntries: allEntries.length,
      totalFilesWithContent: filesContent.length,
      omittedLargeFiles,
      criticalFiles,
      securityHints,
      generatedAt,
    },
    tree: treeLines,
    files: filesContent,
  };
}

// ==========================================
// NOVA FUNÇÃO: FATIADOR DE CONHECIMENTO PARA O WEBUI
// ==========================================
function generateSplittedKnowledge(report: ReportStructure) {
  const targetDir = path.join(ROOT, "project-knowledge");

  // Limpa ou cria a pasta de outputs fragmentados
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Meta-relatório e Estrutura de Árvore
  let metadataMd = `# 00 - Estrutura Geral do Projeto\n\nGerado em: ${report.timestamp}\n\n## Árvore de Diretórios\n\`\`\`\n${report.tree.join("\n")}\n\`\`\`\n`;
  fs.writeFileSync(
    path.join(targetDir, "00-projeto-estrutura.md"),
    metadataMd,
    "utf8"
  );

  // Categorias lógicas baseadas nas pastas para fatiar os arquivos com conteúdo
  const categories: Record<string, { title: string; files: FileEntry[] }> = {
    configs: { title: "Configurações Globais e Root", files: [] },
    backend: { title: "Infraestrutura Backend e Rotas Server", files: [] },
    database: { title: "Mapeamento e Schemas de Banco de Dados", files: [] },
    frontend_core: {
      title: "Frontend Core Contexts, Hooks e Stores",
      files: [],
    },
    frontend_ui: { title: "Frontend Componentes de UI e Páginas", files: [] },
    scripts: { title: "Scripts Utilitários de Automação", files: [] },
  };

  // Separa cada arquivo coletado na sua respectiva categoria
  report.files.forEach(file => {
    const p = file.path;
    if (ROOT_FILES.includes(p)) {
      categories.configs.files.push(file);
    } else if (p.startsWith("drizzle/")) {
      categories.database.files.push(file);
    } else if (p.startsWith("server/")) {
      categories.backend.files.push(file);
    } else if (p.startsWith("client/src/_core/")) {
      categories.frontend_core.files.push(file);
    } else if (p.startsWith("client/src/")) {
      categories.frontend_ui.files.push(file);
    } else if (p.startsWith("scripts/")) {
      categories.scripts.files.push(file);
    }
  });

  // Grava um arquivo .md separado para cada bloco lógico, evitando estourar o Open WebUI
  let index = 1;

  Object.entries(categories).forEach(([key, cat]) => {
    if (cat.files.length === 0) return;

    let catMd = `# ${index.toString().padStart(2, "0")} - ${cat.title}\n\n`;
    catMd += `Contém ${cat.files.length} arquivos mapeados nesta seção.\n\n---\n\n`;

    cat.files.forEach(file => {
      catMd += `### Arquivo: \`${file.path}\` (${file.sizeKB} KB)\n\n`;
      catMd += `\`\`\`${file.language}\n`;
      catMd += file.content;
      catMd += "\n```\n\n---\n\n";
    });

    const safeFileName = `${index.toString().padStart(2, "0")}-${key}.md`;
    fs.writeFileSync(path.join(targetDir, safeFileName), catMd, "utf8");
    index++;
  });

  console.log(
    `[project-report] 📂 Conhecimento fatiado gerado com sucesso em: ${targetDir}`
  );
}

function generateMarkdown(report: ReportStructure): string {
  let md = "# Relatorio do Projeto\n\n";
  md += `Gerado em: ${report.timestamp}\n\n`;

  md += "## Resumo\n\n";
  md += `- Modo: ${report.summary.mode}\n`;
  md += `- Total de entradas: ${report.summary.totalEntries}\n`;
  md += `- Arquivos com conteudo: ${report.summary.totalFilesWithContent}\n`;
  md += `- Arquivos grandes omitidos: ${report.summary.omittedLargeFiles}\n`;
  md += `- Arquivos criticos detectados: ${report.summary.criticalFiles.length}\n`;
  md += `- Alertas tecnicos detectados: ${report.summary.securityHints.length}\n`;
  md += `- Gerado em: ${report.summary.generatedAt}\n\n`;

  if (report.summary.criticalFiles.length > 0) {
    md += "## Arquivos Criticos Detectados\n\n";
    for (const file of report.summary.criticalFiles) {
      md += `- ${file}\n`;
    }
    md += "\n";
  }

  if (report.summary.securityHints.length > 0) {
    md += "## Alertas Tecnicos / Security Hints\n\n";
    for (const hint of report.summary.securityHints) {
      md += `- \`${hint.file}\`: ${hint.issue}\n`;
    }
    md += "\n";
  }

  md += "## Estrutura do Projeto\n\n";
  md += "```\n";
  md += report.tree.join("\n");
  md += "```\n\n";

  md += "## Conteudo dos Arquivos\n\n";

  report.files.forEach(file => {
    md += `### Arquivo: \`${file.path}\`\n\n`;
    md += `\`\`\`${file.language}\n`;
    md += file.content;
    md += "\n```\n\n";
    md += "---\n\n";
  });

  return md;
}

function writeHistoryFiles(report: ReportStructure, markdown: string) {
  if (!SAVE_HISTORY) return;

  const reportsDir = path.join(ROOT, "project-reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const safeTimestamp = report.timestamp.replace(/[:.]/g, "-");
  fs.writeFileSync(
    path.join(reportsDir, `project-report-${safeTimestamp}.json`),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    path.join(reportsDir, `project-report-${safeTimestamp}.md`),
    markdown,
    "utf8"
  );
}

try {
  const report = generateReportData();
  const markdown = generateMarkdown(report);

  const jsonPath = path.join(ROOT, "project-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const mdPath = path.join(ROOT, "project-report.md");
  fs.writeFileSync(mdPath, markdown, "utf8");

  writeHistoryFiles(report, markdown);

  // Executa o fatiador automático
  generateSplittedKnowledge(report);

  console.log(
    `[project-report] Relatorio gerado com sucesso em modo "${REPORT_MODE}".`
  );
  console.log(`[project-report] JSON: ${jsonPath}`);
  console.log(`[project-report] Markdown: ${mdPath}`);
} catch (error: unknown) {
  const reason = error instanceof Error ? error.message : "erro desconhecido";
  console.warn(`[project-report] Falha ao gerar relatorio: ${reason}`);
  process.exit(1);
}
