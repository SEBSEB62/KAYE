// This file is used for TypeScript type definitions for environment variables.
// It ensures that TypeScript recognizes variables under the `process.env` object,
// which is assumed to be available in the execution environment.

declare namespace NodeJS {
  interface ProcessEnv {
    // The primary API key for Google's Generative AI services (Gemini).
    readonly VITE_GEMINI_API_KEY: string;

    // Firebase configuration variables.
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_AUTH_DOMAIN: string;
    readonly VITE_PROJECT_ID: string;
    readonly VITE_STORAGE_BUCKET: string;
    readonly VITE_MESSAGING_SENDER_ID: string;
    readonly VITE_APP_ID: string;
  }
}
