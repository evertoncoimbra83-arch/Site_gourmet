import posthog from 'posthog-js';

export const Analytics = {
  // Inicialização
  init: () => {
    if (typeof window !== 'undefined') {
      posthog.init('TEU_TOKEN_AQUI', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true, // Rastreia mudanças de página automaticamente
      });
    }
  },

  track: (event: string, properties?: Record<string, unknown>) => {
    posthog.capture(event, properties);
  },

  // Identificar o utilizador após o Login
  identify: (userId: string, email: string, name: string) => {
    posthog.identify(userId, { email, name });
  },

  // Limpar ao fazer Logout
  reset: () => posthog.reset(),
};