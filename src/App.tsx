import { useCallback, useEffect, useState, type CSSProperties } from "react";
import CinemaSite, {
  type CinemaFocusRequest,
  type CinemaShellView,
} from "./cinema/CinemaSite";
import ConcertSite from "./concert/ConcertSite";
import LoginStrip from "./components/LoginStrip";
import ParkingPage from "./facilities/ParkingPage";
import type { MallIntentPayload } from "./mall/mallIntent";
import MallSite from "./mall/MallSite";
import SehyeonChatbot from "./components/SehyeonChatbot";
import type { ChatNavigateAction } from "./components/localChatbotBrain";
import SehyeonSessionCelebration from "./components/SehyeonSessionCelebration";
import ClickSparkLayer from "./components/ClickSparkLayer";
import SehyeonFooterMeta from "./components/SehyeonFooterMeta";
import PortalScreenFx from "./components/PortalScreenFx";

type Portal = "mall" | "cinema" | "concert";

export default function App() {
  const [kiosk] = useState(
    () => new URLSearchParams(window.location.search).get("kiosk") === "1"
  );
  const [portal, setPortal] = useState<Portal>("mall");
  const [surface, setSurface] = useState<"portals" | "parking">("portals");
  const [mallIntentKey, setMallIntentKey] = useState(0);
  const [mallIntent, setMallIntent] = useState<MallIntentPayload>({});
  const [cinemaFocus, setCinemaFocus] = useState<
    CinemaFocusRequest | undefined
  >();
  const [concertFocusTok, setConcertFocusTok] = useState(0);
  /** 시네마 탭(또는 빠른 이동) 클릭할 때마다 증가 → 별 연출 재생 */
  const [cinemaFx, setCinemaFx] = useState(0);
  /** 콘서트 탭 클릭할 때마다 증가 → 입장·슬라이드 연출 재생 */
  const [concertFx, setConcertFx] = useState(0);
  /** 세현몰 탭 클릭할 때마다 증가 → 상단 별·반짝 연출 */
  const [mallFx, setMallFx] = useState(0);
  /** 화면·탭 전환마다 증가 → 전역 버스트 + 본문 진입 애니 variant */
  const [portalBurst, setPortalBurst] = useState(0);

  const bumpPortalBurst = useCallback(() => {
    setPortalBurst((n) => n + 1);
  }, []);

  /** 상단 탭·빠른 이동 모두 동일 규칙: 시네마/콘서트일 때만 FX 카운터 증가 */
  const activatePortal = useCallback(
    (next: Portal) => {
      bumpPortalBurst();
      setPortal(next);
      if (next === "mall") setMallFx((n) => n + 1);
      if (next === "cinema") setCinemaFx((n) => n + 1);
      if (next === "concert") setConcertFx((n) => n + 1);
    },
    [bumpPortalBurst]
  );

  const goMall = useCallback(
    (payload: MallIntentPayload) => {
      setSurface("portals");
      activatePortal("mall");
      setMallIntent(payload);
      setMallIntentKey((k) => k + 1);
    },
    [activatePortal]
  );

  const goCinema = useCallback(
    (view: CinemaShellView) => {
      setSurface("portals");
      activatePortal("cinema");
      setCinemaFocus((prev) => ({
        view,
        token: (prev?.token ?? 0) + 1,
      }));
    },
    [activatePortal]
  );

  const goConcertSeats = useCallback(() => {
    setSurface("portals");
    activatePortal("concert");
    setConcertFocusTok((t) => t + 1);
  }, [activatePortal]);

  const handleChatNavigate = useCallback(
    (a: ChatNavigateAction) => {
      if (a.kind === "parking") {
        bumpPortalBurst();
        setSurface("parking");
        return;
      }
      setSurface("portals");
      if (a.kind === "mall") {
        goMall(a.payload);
        return;
      }
      if (a.kind === "cinema") {
        goCinema(a.view);
        return;
      }
      activatePortal("concert");
      if (a.focusSeats) setConcertFocusTok((t) => t + 1);
    },
    [goMall, goCinema, activatePortal, bumpPortalBurst]
  );

  useEffect(() => {
    if (kiosk) {
      document.title = "세현 시네마 · 키오스크 데모";
      return;
    }
    if (surface === "parking") {
      document.title = "지하 주차 안내 · 세현 복합 단지";
      return;
    }
    const label =
      portal === "mall"
        ? "세현몰"
        : portal === "cinema"
          ? "세현 시네마"
          : "세현 콘서트";
    document.title = `${label} · 세현 복합 단지 데모`;
  }, [kiosk, surface, portal]);

  if (kiosk) {
    return (
      <div style={shell.page} className="sehyeon-app-shell">
        <ClickSparkLayer />
        <a
          href={
            typeof window !== "undefined"
              ? window.location.pathname || "/"
              : "/"
          }
          style={shell.kioskExit}
        >
          ← 일반 화면으로 (?kiosk=1 없이 열기)
        </a>
        <CinemaSite kiosk />
      </div>
    );
  }

  if (surface === "parking") {
    return (
      <div
        style={shell.page}
        className="sehyeon-app-shell sehyeon-parking-shell"
      >
        <ClickSparkLayer />
        <PortalScreenFx burstKey={portalBurst} portal={portal} />
        <ParkingPage
          onBack={() => {
            bumpPortalBurst();
            setSurface("portals");
          }}
        />
        <footer className="sehyeon-site-footer sehyeon-site-footer--parking" role="contentinfo">
          <div className="sehyeon-site-footer-inner">
            <SehyeonFooterMeta />
          </div>
        </footer>
        <SehyeonChatbot
          portal={portal}
          surface="parking"
          onNavigate={handleChatNavigate}
        />
      </div>
    );
  }

  return (
    <div style={shell.page} className="sehyeon-app-shell">
      <ClickSparkLayer />
      <a className="sehyeon-skip-link" href="#sehyeon-main">
        본문으로 건너뛰기
      </a>
      <SehyeonSessionCelebration />
      <div
        style={shell.ribbon}
        className="sehyeon-ribbon sehyeon-ribbon-luxe sehyeon-ribbon-row"
        role="banner"
      >
        <span className="sehyeon-ribbon-live" title="시연용 데모">
          <span className="sehyeon-ribbon-live-dot" aria-hidden />
          DEMO LIVE
        </span>
        <span style={shell.ribbonText} className="sehyeon-ribbon-text">
          세현 타워 · 쇼핑 / 시네마 10F / 라이브 홀 — 데모 단일 사이트
        </span>
      </div>
      <div
        style={shell.portalBar}
        className="sehyeon-aurora-bar"
        role="navigation"
        aria-label="사이트 전환"
      >
        <div style={shell.portalInner}>
          <div style={shell.brandCluster}>
            <span style={shell.brandMark} className="sehyeon-brand-mark" aria-hidden>
              世
            </span>
            <div style={shell.brandTextBlock}>
              <span style={shell.brandTitle} className="sehyeon-brand-title-anim">
                세현 복합 단지
              </span>
              <span style={shell.portalHint} className="sehyeon-portal-hint-en">
                SEHYEON COMPLEX · 데모
              </span>
            </div>
          </div>
          <div style={shell.portalTabs} className="sehyeon-portal-tabs">
            <button
              type="button"
              style={{
                ...shell.tab,
                ...(portal === "mall" ? shell.tabOnMall : {}),
              }}
              aria-current={portal === "mall" ? "page" : undefined}
              onClick={() => activatePortal("mall")}
            >
              <span style={shell.tabIcon} aria-hidden>
                🛍
              </span>
              세현몰
            </button>
            <button
              type="button"
              style={{
                ...shell.tab,
                ...(portal === "cinema" ? shell.tabOnCinema : {}),
              }}
              aria-current={portal === "cinema" ? "page" : undefined}
              onClick={() => activatePortal("cinema")}
            >
              <span style={shell.tabIcon} aria-hidden>
                🎬
              </span>
              시네마
            </button>
            <button
              type="button"
              style={{
                ...shell.tab,
                ...(portal === "concert" ? shell.tabOnConcert : {}),
              }}
              aria-current={portal === "concert" ? "page" : undefined}
              onClick={() => activatePortal("concert")}
            >
              <span style={shell.tabIcon} aria-hidden>
                🎤
              </span>
              콘서트
            </button>
          </div>
          <LoginStrip />
        </div>
      </div>

      <div style={shell.facilityWrap} className="sehyeon-facility-luxe">
        <div
          style={shell.facilityBar}
          className="sehyeon-facility-bar"
          role="navigation"
          aria-label="단지 시설"
        >
          <span style={shell.facilityLabel}>빠른 이동</span>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => {
              bumpPortalBurst();
              setSurface("parking");
            }}
          >
            🅿 지하 주차
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goMall({ floorTab: 9, category: "전체" })}
          >
            🍽 9F 식당가
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goMall({ floorTab: -1, category: "마트" })}
          >
            🛒 B1 마트
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goMall({ floorTab: 12, category: "라운지" })}
          >
            ☁ 12F 스카이
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({
                floorTab: 1,
                category: "의류",
              })
            }
          >
            👕 1F 패션
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({ floorTab: 10, category: "전체" })
            }
          >
            🎫 10F 영화·매점
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({ floorTab: 6, category: "전체" })
            }
          >
            🧸 6F 키즈
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({ floorTab: 7, category: "전자" })
            }
          >
            💻 7F 전자
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({
                floorTab: "전체",
                category: "전체",
                scrollTo: "best",
              })
            }
          >
            ⭐ 몰 베스트
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({
                floorTab: "전체",
                category: "전체",
                scrollTo: "cart",
              })
            }
          >
            🛍 장바구니
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() =>
              goMall({
                floorTab: "전체",
                category: "전체",
                scrollTo: "zoom",
              })
            }
          >
            📹 Zoom 상담
          </button>
          <a
            href={`${typeof window !== "undefined" ? window.location.pathname || "/" : "/"}?kiosk=1`}
            style={shell.facilityLink}
          >
            🖥 키오스크
          </a>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goCinema("chart")}
          >
            🎞 무비차트
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goCinema("timetable")}
          >
            ⏱ 상영시간표
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goCinema("store")}
          >
            🍿 시네마 매점
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={() => goCinema("my")}
          >
            🎟 영화 예매내역
          </button>
          <button
            type="button"
            style={shell.facilityBtn}
            onClick={goConcertSeats}
          >
            🎤 콘서트 좌석
          </button>
        </div>
      </div>

      <main id="sehyeon-main" tabIndex={-1} className="sehyeon-main-surface">
        <PortalScreenFx burstKey={portalBurst} portal={portal} />
        <div
          key={`${portal}-${portalBurst}`}
          className={`sehyeon-portal-mount sehyeon-portal-mount--vx-${portalBurst % 8}`}
        >
          {portal === "mall" && (
            <MallSite
              intentVersion={mallIntentKey}
              intent={mallIntent}
              fxPulse={mallFx}
            />
          )}
          {portal === "cinema" && (
            <CinemaSite focus={cinemaFocus} fxPulse={cinemaFx} />
          )}
          {portal === "concert" && (
            <ConcertSite focusToken={concertFocusTok} fxPulse={concertFx} />
          )}
        </div>
        <footer className="sehyeon-site-footer" role="contentinfo">
          <div className="sehyeon-site-footer-inner">
            <SehyeonFooterMeta />
            <p className="sehyeon-site-footer-line">
              <span className="sehyeon-site-footer-strong">
                세현 복합 단지 데모
              </span>
              · 브라우저 로컬 저장 · 실제 결제·배송 없음
            </p>
            <p className="sehyeon-site-footer-sub">
              과제·포트폴리오용 시연 UI — 천천히 둘러보셔도 좋아요 ✨
            </p>
          </div>
        </footer>
      </main>
      <SehyeonChatbot
        portal={portal}
        surface="portals"
        onNavigate={handleChatNavigate}
      />
    </div>
  );
}

const shell: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
  },
  ribbon: {
    background:
      "linear-gradient(112deg, #1a0a2e 0%, #4a1942 12%, #7c2d12 28%, #b45309 44%, #0e7490 58%, #1e3a5f 72%, #312e81 86%, #0f172a 100%)",
    backgroundSize: "300% 100%",
    borderBottom: "1px solid rgba(251,191,36,0.28)",
    textAlign: "center",
    padding: "10px 14px",
    boxShadow:
      "inset 0 -1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(124,58,237,0.15)",
  },
  ribbonText: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(255,252,245,0.98)",
    textShadow:
      "0 0 22px rgba(251,191,36,0.45), 0 0 40px rgba(244,63,94,0.2), 0 1px 2px rgba(0,0,0,0.5)",
  },
  kioskExit: {
    display: "block",
    textAlign: "center",
    padding: "10px 12px",
    fontSize: "0.8rem",
    color: "#bfdbfe",
    background: "linear-gradient(180deg,#0f172a,#020617)",
    borderBottom: "1px solid #1e3a5f",
  },
  portalBar: {
    background:
      "linear-gradient(172deg, rgba(38,26,58,0.97) 0%, rgba(14,12,28,0.99) 38%, rgba(22,12,38,0.98) 58%, rgba(10,10,20,0.99) 100%)",
    color: "#eee",
    borderBottom: "1px solid rgba(251,191,36,0.14)",
    boxShadow:
      "0 0 48px rgba(124,58,237,0.14), 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(244,63,94,0.08)",
    backdropFilter: "blur(18px) saturate(1.15)",
  },
  portalInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  brandCluster: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1.12rem",
    color: "#fff",
    background:
      "linear-gradient(145deg, #fb923c 0%, #f43f5e 28%, #c45c3e 48%, #a855f7 72%, #6366f1 100%)",
    boxShadow:
      "0 0 28px rgba(251,191,36,0.35), 0 0 44px rgba(244,63,94,0.4), 0 0 56px rgba(124,58,237,0.22), inset 0 2px 0 rgba(255,255,255,0.35)",
    border: "1px solid rgba(255,255,255,0.28)",
  },
  brandTextBlock: { display: "flex", flexDirection: "column", gap: 2 },
  brandTitle: {
    fontSize: "1.06rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    background:
      "linear-gradient(102deg, #fff 0%, #fef9c3 18%, #fde68a 32%, #fbcfe8 52%, #e9d5ff 68%, #fde68a 82%, #fff 100%)",
    backgroundSize: "220% 100%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    filter:
      "drop-shadow(0 0 10px rgba(251,191,36,0.55)) drop-shadow(0 0 18px rgba(167,139,250,0.4)) drop-shadow(0 0 26px rgba(244,63,94,0.22))",
  },
  portalHint: {
    fontSize: "0.62rem",
    color: "var(--shell-muted)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  portalTabs: { display: "flex", gap: 8, flexWrap: "wrap", flex: "1 1 200px", justifyContent: "center" },
  tabIcon: { marginRight: 5, fontSize: "0.85rem", opacity: 0.95 },
  tab: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
    color: "#e5e7eb",
    padding: "9px 18px",
    borderRadius: 999,
    fontSize: "0.8rem",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    transition: "background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  tabOnMall: {
    borderColor: "rgba(251,191,36,0.45)",
    color: "#fff",
    background:
      "linear-gradient(145deg, rgba(251,191,36,0.22) 0%, rgba(196,92,62,0.38) 45%, rgba(196,92,62,0.15) 100%)",
    boxShadow:
      "0 0 0 1px rgba(251,191,36,0.35), 0 8px 28px rgba(196,92,62,0.22), inset 0 1px 0 rgba(255,255,255,0.15)",
    transform: "translateY(-2px)",
  },
  tabOnCinema: {
    borderColor: "rgba(251,113,133,0.55)",
    color: "#fff",
    background:
      "linear-gradient(145deg, rgba(251,113,133,0.25) 0%, rgba(244,63,94,0.32) 50%, rgba(190,18,60,0.12) 100%)",
    boxShadow:
      "0 0 0 1px rgba(244,63,94,0.45), 0 8px 28px rgba(244,63,94,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
    transform: "translateY(-2px)",
  },
  tabOnConcert: {
    borderColor: "rgba(196,181,253,0.55)",
    color: "#fff",
    background:
      "linear-gradient(145deg, rgba(167,139,250,0.28) 0%, rgba(124,58,237,0.32) 50%, rgba(88,28,135,0.15) 100%)",
    boxShadow:
      "0 0 0 1px rgba(167,139,250,0.5), 0 8px 28px rgba(124,58,237,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
    transform: "translateY(-2px)",
  },
  facilityWrap: {
    background: "linear-gradient(180deg, #050508 0%, #100c18 42%, #161022 55%, #08070c 100%)",
    borderBottom: "1px solid rgba(251,191,36,0.16)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.35)",
  },
  facilityBar: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "10px 16px 12px",
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 8,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
  },
  facilityLabel: {
    flex: "0 0 auto",
    fontSize: "0.64rem",
    color: "#fcd34d",
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginRight: 4,
    paddingRight: 10,
    borderRight: "1px solid rgba(251,191,36,0.22)",
    textShadow: "0 0 18px rgba(251,191,36,0.35)",
  },
  facilityBtn: {
    flex: "0 0 auto",
    border: "1px solid rgba(255,255,255,0.14)",
    background:
      "linear-gradient(165deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0.07) 100%)",
    color: "#f3f4f6",
    padding: "7px 14px",
    borderRadius: 999,
    fontSize: "0.73rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.18s",
    boxShadow: "0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
  },
  facilityLink: {
    flex: "0 0 auto",
    border: "1px solid rgba(125,211,252,0.45)",
    background:
      "linear-gradient(155deg, rgba(56,189,248,0.22) 0%, rgba(30,64,175,0.45) 50%, rgba(30,58,138,0.35) 100%)",
    color: "#e0f2fe",
    padding: "7px 14px",
    borderRadius: 999,
    fontSize: "0.73rem",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
    boxShadow: "0 0 20px rgba(56,189,248,0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
  },
};
