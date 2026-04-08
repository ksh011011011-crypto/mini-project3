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
  /** 5173 대역이 다른 터미널에 잡혀 있을 때가 많아, 이 프로젝트 전용 기본 포트로 둡니다. */
  /** host: 같은 Wi‑Fi의 폰·다른 PC에서 http://<PC의 LAN IP>:5188 접속 가능. */
  server: {
    host: "0.0.0.0",
    port: 5188,
    strictPort: false,
  },
});
