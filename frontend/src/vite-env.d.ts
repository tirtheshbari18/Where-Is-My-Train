/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL the railway API is reached at. Defaults to `/api` (same origin). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
