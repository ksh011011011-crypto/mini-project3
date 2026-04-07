import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** 상대 경로: 서브디렉터리 배포·로컬 file 열람 시 에셋 404를 줄입니다. */
export default defineConfig({
  plugins: [react()],
  base: "./",
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
  server: {
    host: true,
  },
});
