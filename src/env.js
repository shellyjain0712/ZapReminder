import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * 🔒 Server-side environment variables schema
   * These are never exposed to the client
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()                 // Required in production
        : z.string().optional(),     // Optional in dev
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    EMAIL_SERVER_USER: z.string(),
    EMAIL_SERVER_PASSWORD: z.string(),
    EMAIL_SERVER_HOST: z.string(),
    EMAIL_SERVER_PORT: z.string(),
    EMAIL_FROM: z.string().email(),
  },

  /**
   * 🌐 Client-side environment variables schema
   * Must be prefixed with NEXT_PUBLIC_ in `.env` to be exposed
   */
  client: {
    // Example:
    // NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  },

  /**
   * 🔄 Runtime bindings for process.env
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_FROM: process.env.EMAIL_FROM,
  },

  /**
   * 🛠 Skip validation for special cases (e.g. Docker)
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * 🧼 Treat empty strings as undefined (avoids false positives)
   */
  emptyStringAsUndefined: true,
});
