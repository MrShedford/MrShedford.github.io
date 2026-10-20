/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Changes every build; appended to data URLs so a deploy is never served stale JSON. */
  readonly VITE_BUILD_ID: string
}
