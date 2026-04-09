import pptxgen from "pptxgenjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "docs", "세현-복합단지-발표.pptx");

const FONT = "맑은 고딕";
const TITLE_COLOR = "1e3a8a";
const BODY_SIZE = 15;
const TITLE_SIZE = 26;

const pres = new pptxgen();
pres.author = "세현 복합 단지 데모";
pres.title = "세현 복합 단지 데모 — 발표";
pres.subject = "Mini Project";

function addTitleSlide() {
  const s = pres.addSlide();
  s.background = { color: "0f172a" };
  s.addText("세현 복합 단지", {
    x: 0.5,
    y: 1.85,
    w: 9,
    h: 0.9,
    fontSize: 38,
    bold: true,
    color: "FFFFFF",
    fontFace: FONT,
    align: "center",
  });
  s.addText("통합 웹 데모 · 발표 자료", {
    x: 0.5,
    y: 2.75,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: "93c5fd",
    fontFace: FONT,
    align: "center",
  });
  s.addText("React · TypeScript · Vite | 몰 · 시네마 · 콘서트 · 주차", {
    x: 0.5,
    y: 3.35,
    w: 9,
    h: 0.45,
    fontSize: 13,
    color: "cbd5e1",
    fontFace: FONT,
    align: "center",
  });
}

function addBulletSlide(title, lines) {
  const s = pres.addSlide();
  s.addText(title, {
    x: 0.45,
    y: 0.35,
    w: 9.1,
    h: 0.65,
    fontSize: TITLE_SIZE,
    bold: true,
    color: TITLE_COLOR,
    fontFace: FONT,
  });
  const body = lines.map((t, i) => ({
    text: t,
    options: { bullet: true, breakLine: i < lines.length - 1 },
  }));
  s.addText(body, {
    x: 0.55,
    y: 1.15,
    w: 9,
    h: 4.6,
    fontSize: BODY_SIZE,
    fontFace: FONT,
    color: "1f2937",
    valign: "top",
  });
}

addTitleSlide();

addBulletSlide("프로젝트 개요", [
  "복합 문화·상업 시설을 단일 포털에서 시연하는 프론트엔드 데모",
  "실제 결제·백엔드 없이 로컬 상태로 장바구니·예매·주차 흐름 재현",
  "탭 전환·BGM·챗봇·시각 연출로 발표 시연에 맞춘 완성도",
]);

addBulletSlide("화면 구조", [
  "상단 탭: 세현몰 / 세현 시네마 / 콘서트",
  "주차장은 별도 화면(surface) 전환 + 시설 스트립에서 진입",
  "챗봇: 키워드·명령으로 탭 이동·주차 화면 이동 (localChatbotBrain)",
]);

addBulletSlide("코드 핵심 — App.tsx", [
  "portal: 현재 탭(mall | cinema | concert)",
  "portalBurst: 전환마다 증가 → PortalScreenFx(풀스크린 버스트) + 입장 애니",
  "mallFx / cinemaFx / concertFx: 각 히어로 별·반짝 등 화면별 연출",
  "본문 key = `${portal}-${portalBurst}` → 탭마다 리마운트로 CSS 애니 재생",
]);

addBulletSlide("연출 · 인터랙션", [
  "index.css: 포털 마운트 8종, 버스트 8종, 몰/시네마/콘서트 별 레이어",
  "ClickSparkLayer: 전역 클릭 스파크 (접근성: prefers-reduced-motion 대응)",
  "콘서트 슬라이더: Unsplash 스톡 이미지 + 뷰포트 글로우",
]);

addBulletSlide("BGM · 사운드", [
  "각 탭 우측 하단 AmbientDock: 사용자 클릭 후 재생(브라우저 정책)",
  "Mixkit 풀 트랙 URL + 실패 시 Web Audio 폴백(proceduralFarewellAmbient)",
]);

addBulletSlide("기술 스택 · 실행", [
  "React 18, TypeScript, Vite 6, base: 상대 경로(서브디렉터리 배포 대비)",
  "개발: npm run dev (0.0.0.0:5188 — 같은 Wi-Fi 기기 접속 가능)",
  "배포: npm run build 후 정적 호스팅",
]);

addBulletSlide("마무리", [
  "실제 결제·배송 없이 단일 프론트로 복합 단지 UX를 시연 가능한 구조",
  "질문 환영합니다",
]);

await pres.writeFile({ fileName: outPath });
console.log("PPT 저장:", outPath);
