export const serverEnv = {
  JWT_SECRET: process.env.JWT_SECRET ?? "secret-key",
  JWT_EXPIRED: Number(process.env.JWT_EXPIRED ?? 0),

  AI_BASE_URL: process.env.AI_BASE_URL ?? 'url',
  AI_API_KEY: process.env.AI_API_KEY ?? 'api-key',
  AI_MODEL: process.env.AI_MODEL ?? process.env.AI_FALLBACK_MODEL ?? 'model', 
};
