import { Queue, type ConnectionOptions } from "bullmq";

const redisUrl = process.env.REDIS_URL;

const redisConfig: ConnectionOptions = redisUrl
  ? {
      url: redisUrl,
      maxRetriesPerRequest: null,
    }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    };

// Nome da fila
export const NUTRI_QUEUE_NAME = "nutri-prescription-process";

// Criamos a fila passando o objeto de configuração
export const nutriQueue = new Queue(NUTRI_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

/**
 * Função para adicionar uma dieta na fila
 */
export async function addPrescriptionToQueue(data: {
  scanId: string;
  rawText: string;
  userId?: string;
}) {
  return await nutriQueue.add("analyze-prescription", data);
}