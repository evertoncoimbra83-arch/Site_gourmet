import type { Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { createWriteStream } from "node:fs";
import {
  createReadStream,
  existsSync,
  promises as fs,
} from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";

import { lucia } from "../../auth.js";
import { createRateLimitMiddleware, superAdminProcedure, router } from "../../_core/trpc.js";
import { logger } from "../../logger.js";
import { AuditLogService } from "../../services/AuditLogService.js";

const BACKUP_DIR = "/var/backups";
const BACKUP_FILE_REGEX = /^[a-zA-Z0-9._-]+\.sql\.gz$/;
const createBackupRateLimit = createRateLimitMiddleware({
  keyPrefix: "admin.backups.create",
  limit: 1,
  windowMs: 30_000,
});

let backupCreationInProgress = false;
let lastBackupCreatedAt = 0;

type BackupMetadata = {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: Date;
};

export type DatabaseCredentials = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

function sanitizeFilename(filename: string): string | null {
  return BACKUP_FILE_REGEX.test(filename) ? filename : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function resolveBackupPath(filename: string): string {
  const safeFilename = sanitizeFilename(filename);
  if (!safeFilename) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Nome de arquivo inválido.",
    });
  }

  const resolvedPath = path.resolve(BACKUP_DIR, safeFilename);
  const resolvedDir = path.resolve(BACKUP_DIR);
  const expectedPrefix = `${resolvedDir}${path.sep}`;

  if (resolvedPath !== path.join(resolvedDir, safeFilename) &&
      !resolvedPath.startsWith(expectedPrefix)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Arquivo fora do diretório permitido.",
    });
  }

  if (
    resolvedPath !== resolvedDir &&
    !resolvedPath.startsWith(expectedPrefix)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Arquivo fora do diretório permitido.",
    });
  }

  return resolvedPath;
}

async function ensureBackupDirectory() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

async function toBackupMetadata(filename: string): Promise<BackupMetadata> {
  const stat = await fs.stat(resolveBackupPath(filename));
  return {
    filename,
    sizeBytes: stat.size,
    sizeFormatted: formatBytes(stat.size),
    modifiedAt: stat.mtime,
  };
}

async function listBackupFiles(): Promise<BackupMetadata[]> {
  await ensureBackupDirectory();
  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const safeFilename = sanitizeFilename(entry.name);
        if (!safeFilename) return null;

        try {
          return await toBackupMetadata(safeFilename);
        } catch {
          return null;
        }
      }),
  );

  return backups
    .filter((item): item is BackupMetadata => item !== null)
    .sort(
      (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime(),
    );
}

export function getDatabaseCredentials(): DatabaseCredentials {
  const databaseUrl = process.env.DATABASE_URL;
  let parsedUrl: URL | null = null;

  if (databaseUrl) {
    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      logger.warn("DATABASE_URL inválida para geração de backup manual.");
    }
  }

  const host =
    process.env.DB_HOST ||
    parsedUrl?.hostname ||
    "127.0.0.1";
  const port =
    process.env.DB_PORT ||
    parsedUrl?.port ||
    "3306";
  const user =
    process.env.DB_USER ||
    parsedUrl?.username ||
    "";
  const password =
    process.env.DB_PASSWORD ||
    process.env.DB_PASS ||
    parsedUrl?.password ||
    "";
  const database =
    process.env.DB_NAME ||
    parsedUrl?.pathname.replace(/^\//, "") ||
    "gourmet_saudavel";

  if (!user || !password || !database) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Configuração de banco incompleta para backup.",
    });
  }

  return { host, port, user, password, database };
}

export function buildTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-") + "_" + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join("-");
}

function sanitizeProcessMessage(message: string, password: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";
  return trimmed.replaceAll(password, "[redacted]");
}

async function createBackupArchive(targetPath: string, credentials: DatabaseCredentials) {
  await ensureBackupDirectory();

  return await new Promise<void>((resolve, reject) => {
    const dump = spawn(
      "mysqldump",
      [
        "-h",
        credentials.host,
        "-P",
        credentials.port,
        "-u",
        credentials.user,
        credentials.database,
      ],
      {
        env: {
          ...process.env,
          MYSQL_PWD: credentials.password,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const gzip = spawn("gzip", ["-c"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const output = createWriteStream(targetPath, { flags: "wx" });

    let dumpClosed = false;
    let gzipClosed = false;
    let outputFinished = false;
    let dumpCode: number | null = null;
    let gzipCode: number | null = null;
    let dumpStderr = "";
    let gzipStderr = "";
    let settled = false;

    const finalize = (error?: Error) => {
      if (settled) return;
      settled = true;

      dump.stdout?.unpipe();
      gzip.stdout?.unpipe();
      output.close();

      if (error) {
        try { dump.kill("SIGTERM"); } catch { /* Windows não suporta SIGTERM */ }
        try { gzip.kill("SIGTERM"); } catch { /* Windows */ }
        void fs.rm(targetPath, { force: true }).finally(() => reject(error));
        return;
      }

      resolve();
    };

    const tryResolve = () => {
      if (!dumpClosed || !gzipClosed || !outputFinished) return;

      if (dumpCode !== 0) {
        finalize(
          new Error(
            sanitizeProcessMessage(dumpStderr, credentials.password) ||
              "mysqldump falhou.",
          ),
        );
        return;
      }

      if (gzipCode !== 0) {
        finalize(
          new Error(
            sanitizeProcessMessage(gzipStderr, credentials.password) ||
              "gzip falhou.",
          ),
        );
        return;
      }

      finalize();
    };

    dump.on("error", () => {
      finalize(new Error("Falha ao iniciar mysqldump."));
    });
    gzip.on("error", () => {
      finalize(new Error("Falha ao iniciar gzip."));
    });
    output.on("error", () => {
      finalize(new Error("Falha ao escrever arquivo de backup."));
    });

    dump.stderr.on("data", (chunk: Buffer) => {
      dumpStderr += chunk.toString("utf8");
    });
    gzip.stderr.on("data", (chunk: Buffer) => {
      gzipStderr += chunk.toString("utf8");
    });

    dump.stdout.pipe(gzip.stdin);
    gzip.stdout.pipe(output);

    output.on("finish", () => {
      outputFinished = true;
      tryResolve();
    });

    dump.on("close", (code) => {
      dumpClosed = true;
      dumpCode = code;
      if (code !== 0) {
        gzip.kill("SIGTERM");
      }
      tryResolve();
    });

    gzip.on("close", (code) => {
      gzipClosed = true;
      gzipCode = code;
      tryResolve();
    });
  });
}

async function requireAdminRequest(req: Request) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

  if (!sessionId) return null;

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user || user.role !== "super_admin") {
    return null;
  }

  return { session, user };
}

export async function handleAdminBackupDownload(req: Request, res: Response) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const safeFilename = sanitizeFilename(req.params.filename || "");
    if (!safeFilename) {
      return res.status(400).json({ error: "Arquivo inválido." });
    }

    const filePath = resolveBackupPath(safeFilename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "Backup não encontrado." });
    }

    // REGISTRO DE AUDITORIA CRÍTICO (LGPD / Segurança)
    const clientIp = typeof req.ip === "string" ? req.ip.split(",")[0].trim() : (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "unknown";
    const requestId = (req as any).requestId || req.headers["x-request-id"] || req.headers["x-correlation-id"] || undefined;

    let sizeBytes = 0;
    try {
      const stats = await fs.stat(filePath);
      sizeBytes = stats.size;
    } catch {
      // Ignora erro ao ler metadados do arquivo
    }

    void AuditLogService.record({
      actor: {
        userId: auth.user.id,
        ipAddress: clientIp,
        userAgent,
        requestId,
      },
      module: "backup",
      action: "DOWNLOAD",
      severity: "critical",
      entityType: "var/backups",
      entityId: safeFilename,
      entityLabel: `Backup Físico: ${safeFilename}`,
      newValues: {
        filename: safeFilename,
        sizeBytes,
      },
    });

    res.setHeader("Content-Type", "application/gzip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`,
    );

    return createReadStream(filePath).pipe(res);
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : "unknown" },
      "Falha ao servir download de backup.",
    );
    return res.status(500).json({ error: "Erro ao baixar backup." });
  }
}

export const backupsAdminRouter = router({
  list: superAdminProcedure.query(async () => {
    return listBackupFiles();
  }),

  create: superAdminProcedure
    .use(createBackupRateLimit)
    .mutation(async () => {
      const now = Date.now();

      if (backupCreationInProgress) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Já existe um backup manual em execução.",
        });
      }

      if (now - lastBackupCreatedAt < 15_000) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Aguarde alguns segundos antes de gerar outro backup.",
        });
      }

      backupCreationInProgress = true;

      try {
        const credentials = getDatabaseCredentials();
        const filename = `manual_${buildTimestamp()}.sql.gz`;
        const targetPath = resolveBackupPath(filename);

        await createBackupArchive(targetPath, credentials);
        lastBackupCreatedAt = Date.now();

        const metadata = await toBackupMetadata(filename);
        logger.info(
          { filename: metadata.filename, sizeBytes: metadata.sizeBytes },
          "Backup manual criado com sucesso.",
        );

        return metadata;
      } catch (error) {
        logger.error(
          { err: error instanceof Error ? error.message : "unknown" },
          "Falha ao gerar backup manual.",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível gerar o backup manual.",
        });
      } finally {
        backupCreationInProgress = false;
      }
    }),

  delete: superAdminProcedure
    .input(
      z.object({
        filename: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const safeFilename = sanitizeFilename(input.filename);
      if (!safeFilename) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nome de arquivo inválido.",
        });
      }

      const backups = await listBackupFiles();
      if (backups.length > 0 && backups[0]?.filename === safeFilename) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é permitido excluir o backup mais recente.",
        });
      }

      const filePath = resolveBackupPath(safeFilename);
      await fs.rm(filePath, { force: true });

      return { success: true, filename: safeFilename };
    }),
});
