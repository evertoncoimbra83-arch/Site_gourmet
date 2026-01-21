import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Helper para executar comandos e capturar output
function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString();
  } catch (e) {
    return `⚠️ Erro ao executar comando: ${cmd}\n${e.stdout?.toString() || e.message}\n`;
  }
}

// Caminho do relatório
const reportPath = path.join(process.cwd(), "ultimate-report.txt");

let report = `=== RELATÓRIO COMPLETO DO PROJETO ===
Projeto: ${process.cwd()}
Data: ${new Date().toLocaleString()}
=========================================================\n\n`;

// --- 1. Node / NPM / Yarn ---
report += "=== VERSÕES ===\n";
report += safeExec("node -v") + "\n";
report += safeExec("npm -v") + "\n";
report += safeExec("yarn -v") + "\n\n";

// --- 2. Estrutura de arquivos ---
report += "=== ESTRUTURA DE ARQUIVOS ===\n";
report += safeExec("tree /F /A") + "\n\n";

// --- 3. Dependências ---
report += "=== DEPENDÊNCIAS INSTALADAS ===\n";
report += safeExec("npm list --depth=0") + "\n\n";

// --- 4. ESLint ---
report += "=== ESLINT ===\n";
const eslintConfigExists = fs.existsSync(path.join(process.cwd(), ".eslintrc.json")) ||
                           fs.existsSync(path.join(process.cwd(), ".eslintrc.js"));

if (eslintConfigExists) {
  report += safeExec("npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings=0") + "\n\n";
} else {
  report += "⚠️ ESLint não configurado. Nenhum arquivo de configuração encontrado.\n\n";
}

// --- 5. TypeScript ---
report += "=== TYPE SCRIPT CHECK (tsc) ===\n";
const tsConfigExists = fs.existsSync(path.join(process.cwd(), "tsconfig.json"));
if (tsConfigExists) {
  report += safeExec("npx tsc --noEmit") + "\n\n";
} else {
  report += "⚠️ tsconfig.json não encontrado. Ignorando verificação TypeScript.\n\n";
}

// --- 6. Build Vite / React ---
report += "=== BUILD VITE/REACT ===\n";
report += safeExec("npm run build") + "\n\n";

// --- 7. Tailwind / CSS ---
report += "=== VERIFICAÇÃO CSS / TAILWIND ===\n";
report += safeExec("npx tailwindcss -i ./client/src/index.css -o ./dist/tailwind.css --minify") + "\n\n";

// --- 8. Testes ---
report += "=== TESTES ===\n";
report += safeExec("npm test -- --watchAll=false") + "\n\n";

// --- 9. Git Status e Últimos commits ---
report += "=== GIT STATUS ===\n";
report += safeExec("git status") + "\n\n";
report += "=== GIT LOG (últimos 5 commits) ===\n";
report += safeExec("git log -5 --oneline") + "\n\n";

// --- 10. Vulnerabilidades ---
report += "=== VULNERABILIDADES (npm audit) ===\n";
report += safeExec("npm audit --audit-level=high") + "\n\n";

// --- 11. Fim ---
report += "=== FIM DO RELATÓRIO ===\n";

fs.writeFileSync(reportPath, report);

console.log(`✅ Relatório gerado: ${reportPath}`);
console.log("Você pode me enviar este arquivo para análise detalhada de erros e warnings.");
