/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GMAIL_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
