export const serverEnv = {
  JWT_SECRET: process.env.JWT_SECRET ?? "secret-key",
  JWT_EXPIRED: Number(process.env.JWT_EXPIRED ?? 0),
};
