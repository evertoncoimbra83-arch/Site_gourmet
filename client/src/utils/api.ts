import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/routers/_app'; // Ajustado o caminho relativo e removida a extensão .ts

/**
 * Este é o cliente tRPC principal para o React.
 * Ele permite que você use hooks como api.user.getAddresses.useQuery()
 */
export const api = createTRPCReact<AppRouter>();