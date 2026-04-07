import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { ALL_SEAT_IDS } from "../cinema/screenings";
import FakeCheckoutModal, {
  type CheckoutLine,
} from "../payment/FakeCheckoutModal";
import { formatKrw } from "../lib/format";
import { formatStars } from "../cinema/movieFilters";
import { CONCERT_MERCH, buildConcertShows } from "./shows";
import { addConcertBooking, loadConcertBookings, saveConcertBookings } from "./storage";
import type { ConcertBooking, ConcertShow } from "./types";
import ConcertHeroSlider from "./ConcertHeroSlider";
import ConcertAmbientDock from "./ConcertAmbientDock";

const rows = "ABCDEFGH".split("");

function mergedOcc(show: ConcertShow, list: ConcertBooking[]): Set<string> {
  const s = new Set(show.occupiedSeatIds);
  for (const b of list) {
    if (b.showId === show.id) b.seats.forEach((x) => s.add(x));
  }
  return s;
}

function seatExtra(seatId: string): number {
  const row = seatId[0];
  if (row === "A") return 198000;
  if (row === "B") return 62000;
  if (/^[CDE][5-8]$/.test(seatId)) return 22000;
  return 0;
}

export default function ConcertSite({
  focusToken = 0,
  fxPulse = 0,
}: {
  /** 상단 빠른 이동 등에서 증가시키면 좌석 구역으로 스크롤 */
  focusToken?: number;
  /** 콘서트 탭 클릭할 때마다 증가 → 입장·슬라이드 연출 */
  fxPulse?: number;
}) {
  const now = useMemo(() => new Date(), []);
  const shows = useMemo(() => buildConcertShows(now), [now]);
  const [show, setShow] = useState<ConcertShow>(shows[0]);
  const [bookings, setBookings] = useState<ConcertBooking[]>(() =>
    loadConcertBookings()
  );
  const [pick, setPick] = useState<string[]>([]);
  const [merchQty, setMerchQty] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"seats" | "merch">("seats");
  const [payOpen, setPayOpen] = useState(false);
  const [portalShine, setPortalShine] = useState(false);

  const refresh = useCallback(() => setBookings(loadConcertBookings()), []);

  useEffect(() => {
    if (fxPulse < 1) return;
    setPortalShine(true);
    const t = window.setTimeout(() => setPortalShine(false), 1200);
    return () => window.clearTimeout(t);
  }, [fxPulse]);

  useEffect(() => {
    if (focusToken < 1) return;
    const id = window.setTimeout(() => {
      document
        .getElementById("concert-booking")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 90);
    return () => window.clearTimeout(id);
  }, [focusToken]);

  const occ = mergedOcc(show, bookings);
  const ticketUnit = (id: string) => show.basePrice + seatExtra(id);
  const ticketTotal = pick.reduce((s, id) => s + ticketUnit(id), 0);
  const merchTotal = CONCERT_MERCH.reduce(
    (s, m) => s + (merchQty[m.id] ?? 0) * m.price,
    0
  );

  const lines = useCallback((): CheckoutLine[] => {
    const ls: CheckoutLine[] = [
      {
        label: "콘서트 티켓",
        detail: `${show.titleKo} · ${pick.sort().join(", ")}`,
        won: ticketTotal,
      },
    ];
    for (const m of CONCERT_MERCH) {
      const q = merchQty[m.id] ?? 0;
      if (q > 0) ls.push({ label: m.name, detail: `×${q}`, won: q * m.price });
    }
    return ls;
  }, [show.titleKo, pick, ticketTotal, merchQty]);

  const closeFlow = () => {
    setPick([]);
    setMerchQty({});
    setStep("seats");
    setPayOpen(false);
  };

  const handlePaid = () => {
    for (const id of pick) {
      if (occ.has(id)) return;
    }
    const merch = CONCERT_MERCH.filter((m) => (merchQty[m.id] ?? 0) > 0).map(
      (m) => ({
        name: m.name,
        qty: merchQty[m.id] ?? 0,
        unitWon: m.price,
      })
    );
    const b: ConcertBooking = {
      id: `ct-${Date.now()}`,
      showId: show.id,
      titleKo: show.titleKo,
      venueLine: `${show.venue} · ${show.hall}`,
      startAt: show.startAt,
      seats: [...pick].sort(),
      merch,
      totalWon: ticketTotal + merchTotal,
      createdAt: Date.now(),
    };
    addConcertBooking(b);
    refresh();
    closeFlow();
  };

  const toggle = (id: string) => {
    if (occ.has(id)) return;
    setPick((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div
      style={cx.page}
      className={portalShine ? "concert-site-root concert-portal-shine" : "concert-site-root"}
    >
      <header style={cx.head}>
        <div style={cx.headInner}>
          <div>
            <div style={cx.brand}>세현 티켓 · 콘서트</div>
            <div style={cx.sub}>예술의전당 · 오페라극장 라인 (데모)</div>
          </div>
        </div>
      </header>

      <main style={cx.main}>
        <section style={cx.hero} className="concert-hero-banner">
          <div style={cx.heroCopy}>
            <h1 style={cx.h1}>LE SSERAFIM</h1>
            <p style={cx.tag}>무대인사 · 미니콘서트 · 현장 MD</p>
            <p style={cx.scoreLine}>
              <span style={cx.starGold}>{formatStars(show.fanScore)}</span>
              <span style={cx.scoreNum}>{show.fanScore.toFixed(1)}</span>
              <span style={cx.scoreSep}>·</span>
              <span style={cx.scoreLbl}>기대지수 (데모)</span>
            </p>
            <p style={cx.note}>
              실제 공연과 무관한 가상 페이지입니다. &quot;여의도·오페라타워 인근&quot;
              예술의전당 본관 오페라극장을 모델로 했습니다.
            </p>
          </div>
          <div style={cx.heroFig}>
            <ConcertHeroSlider portalSpark={fxPulse} />
          </div>
        </section>

        <section style={cx.section}>
          <h2 style={cx.h2}>회차 선택</h2>
          <div style={cx.showRow}>
            {shows.map((s) => (
              <button
                key={s.id}
                type="button"
                style={{
                  ...cx.showBtn,
                  ...(s.id === show.id ? cx.showOn : {}),
                }}
                onClick={() => {
                  setShow(s);
                  setPick([]);
                  setStep("seats");
                  setMerchQty({});
                }}
              >
                <span style={cx.showT}>
                  {new Date(s.startAt).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span style={cx.showS}>{s.hall}</span>
                <span style={cx.showP}>{formatKrw(s.basePrice)}~</span>
                <span style={cx.showStars}>
                  {formatStars(s.fanScore)} {s.fanScore.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="concert-booking" style={cx.section}>
          <h2 style={cx.h2}>좌석 · MD · 결제</h2>
          <p style={cx.lead}>
            관리자 로그인 전에는 결제가 완료되지 않습니다.{" "}
            <strong style={{ color: "#fcd34d" }}>A열</strong>은 맨앞 프리미엄 구역으로
            할증이 크게 붙고, B열·중앙 블록에도 데모 할증이 있습니다.
          </p>

          {step === "seats" && (
            <>
              <div style={cx.screen}>STAGE</div>
              <div style={cx.map}>
                {rows.map((r) => (
                  <div key={r} style={cx.rw}>
                    <span style={cx.rl}>{r}</span>
                    {Array.from({ length: 12 }, (_, i) => {
                      const id = `${r}${i + 1}`;
                      const o = occ.has(id);
                      const sel = pick.includes(id);
                      const vipRow = r === "A";
                      return (
                        <button
                          key={id}
                          type="button"
                          disabled={o}
                          title={
                            vipRow
                              ? "A열 맨앞 프리미엄 · 할증 최대 (데모)"
                                : r === "B"
                                ? "B열 프리미엄 구역 (데모)"
                                : undefined
                          }
                          style={{
                            ...cx.seat,
                            ...(vipRow ? cx.seatVip : r === "B" ? cx.seatPrem : {}),
                            ...(o ? cx.seatO : {}),
                            ...(sel ? cx.seatS : {}),
                          }}
                          onClick={() => toggle(id)}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p style={cx.sum}>
                {pick.length}석 · <strong>{formatKrw(ticketTotal)}</strong>
              </p>
              <div style={cx.actions}>
                <button
                  type="button"
                  style={cx.primary}
                  disabled={pick.length === 0}
                  onClick={() => setStep("merch")}
                >
                  MD(응원봉 등) 담기
                </button>
              </div>
            </>
          )}

          {step === "merch" && (
            <>
              <div style={cx.mList}>
                {CONCERT_MERCH.map((m) => {
                  const q = merchQty[m.id] ?? 0;
                  return (
                    <div key={m.id} style={cx.mRow}>
                      <div>
                        <div style={cx.mName}>{m.name}</div>
                        <div style={cx.mPrice}>{formatKrw(m.price)}</div>
                      </div>
                      <div style={cx.mQty}>
                        <button
                          type="button"
                          style={cx.mini}
                          onClick={() =>
                            setMerchQty((prev) => ({
                              ...prev,
                              [m.id]: Math.max(0, (prev[m.id] ?? 0) - 1),
                            }))
                          }
                        >
                          −
                        </button>
                        <span>{q}</span>
                        <button
                          type="button"
                          style={cx.mini}
                          onClick={() =>
                            setMerchQty((prev) => ({
                              ...prev,
                              [m.id]: (prev[m.id] ?? 0) + 1,
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={cx.sum}>
                티켓 {formatKrw(ticketTotal)} + MD{" "}
                <strong>{formatKrw(merchTotal)}</strong>
              </p>
              <div style={cx.actions}>
                <button type="button" style={cx.ghost} onClick={() => setStep("seats")}>
                  이전
                </button>
                <button type="button" style={cx.primary} onClick={() => setPayOpen(true)}>
                  결제하기
                </button>
              </div>
            </>
          )}
        </section>

        <section style={cx.section}>
          <h2 style={cx.h2}>예매 내역</h2>
          {bookings.length === 0 ? (
            <p style={cx.muted}>없음</p>
          ) : (
            <ul style={cx.ul}>
              {bookings.map((b) => (
                <li key={b.id} style={cx.li}>
                  <div>
                    <div style={cx.t}>{b.titleKo}</div>
                    <div style={cx.muted}>
                      {new Date(b.startAt).toLocaleString("ko-KR")} · {b.venueLine}
                    </div>
                    <div style={cx.muted}>좌석 {b.seats.join(", ")}</div>
                    {b.merch.length > 0 ? (
                      <div style={cx.muted}>
                        MD: {b.merch.map((m) => `${m.name}×${m.qty}`).join(", ")}
                      </div>
                    ) : null}
                  </div>
                  <div style={cx.p}>{formatKrw(b.totalWon)}</div>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            style={cx.danger}
            onClick={() => {
              saveConcertBookings([]);
              refresh();
            }}
          >
            콘서트 예매 전체 삭제
          </button>
        </section>
      </main>

      <FakeCheckoutModal
        open={payOpen}
        title="콘서트 · 결제(데모)"
        lines={lines()}
        onClose={() => setPayOpen(false)}
        onPaid={handlePaid}
        successTitle="콘서트 예매가 완료되었습니다"
        successSubtitle="현장 수령 기준 전자티켓이 발급되었습니다. 예매 내역에서 좌석·MD를 확인해 주세요."
      />

      <footer style={cx.foot}>
        좌석 수 {ALL_SEAT_IDS.length}석 기준 데모 · 르세라핌 실제 일정과 무관합니다.
      </footer>

      <ConcertAmbientDock />
    </div>
  );
}

const cx: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#0b1020", color: "#e5e7eb" },
  head: {
    borderBottom: "1px solid #1f2a4a",
    background: "rgba(11,16,32,0.95)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  headInner: { maxWidth: 900, margin: "0 auto", padding: "14px 16px" },
  brand: { fontWeight: 900, fontSize: "1.05rem" },
  sub: { fontSize: "0.72rem", color: "#93c5fd", marginTop: 4 },
  main: { maxWidth: 900, margin: "0 auto", padding: "20px 16px 48px" },
  hero: {
    border: "1px solid #243056",
    borderRadius: 16,
    padding: "20px 18px",
    marginBottom: 24,
    background: "linear-gradient(135deg,#1e1b4b,#312e81)",
  },
  heroCopy: { minWidth: 0 },
  heroFig: { margin: 0, justifySelf: "center", width: "100%", maxWidth: 280 },
  h1: { margin: "0 0 8px", fontSize: "1.8rem", fontWeight: 900 },
  tag: { margin: "0 0 10px", color: "#c7d2fe", fontWeight: 700 },
  scoreLine: {
    margin: "0 0 10px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    fontSize: "0.85rem",
  },
  starGold: { color: "#fcd34d", letterSpacing: 1 },
  scoreNum: { fontWeight: 900, color: "#fff" },
  scoreSep: { color: "#6366f1" },
  scoreLbl: { color: "#c7d2fe", fontWeight: 600 },
  note: { margin: 0, fontSize: "0.82rem", color: "#a5b4fc", lineHeight: 1.5 },
  section: { marginBottom: 32 },
  h2: { fontSize: "1.05rem", margin: "0 0 10px", fontWeight: 800 },
  lead: { fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.55, margin: "0 0 14px" },
  showRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  showBtn: {
    border: "1px solid #334155",
    background: "#111827",
    color: "#e5e7eb",
    borderRadius: 12,
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
    minWidth: 160,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  showOn: { borderColor: "#a78bfa", boxShadow: "0 0 0 1px rgba(167,139,250,0.5)" },
  showT: { fontWeight: 800, fontSize: "0.9rem" },
  showS: { fontSize: "0.75rem", color: "#94a3b8" },
  showP: { fontSize: "0.8rem", color: "#fcd34d", fontWeight: 800 },
  showStars: { fontSize: "0.72rem", color: "#e9d5ff", fontWeight: 700 },
  screen: {
    textAlign: "center",
    marginBottom: 12,
    padding: "10px 0",
    borderRadius: 8,
    background: "linear-gradient(90deg,#1e293b,#4c1d95,#1e293b)",
    fontWeight: 900,
    letterSpacing: "0.25em",
    fontSize: "0.75rem",
    color: "#c4b5fd",
  },
  map: { display: "flex", flexDirection: "column", gap: 4 },
  rw: { display: "flex", alignItems: "center", gap: 4 },
  rl: { width: 18, fontSize: "0.65rem", color: "#6b7280", textAlign: "center" },
  seat: {
    flex: 1,
    maxWidth: 28,
    height: 26,
    fontSize: "0.55rem",
    borderRadius: 4,
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#9ca3af",
    padding: 0,
    cursor: "pointer",
  },
  seatVip: {
    borderColor: "rgba(252, 211, 77, 0.9)",
    background: "linear-gradient(165deg, rgba(120, 53, 15, 0.95), rgba(30, 27, 59, 0.92))",
    color: "#fffbeb",
    fontWeight: 800,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  seatPrem: {
    borderColor: "rgba(196, 181, 253, 0.7)",
    background: "linear-gradient(165deg, rgba(67, 56, 202, 0.65), rgba(17, 24, 39, 0.92))",
    color: "#ede9fe",
    fontWeight: 700,
  },
  seatO: { opacity: 0.35, cursor: "not-allowed" },
  seatS: { background: "#7c3aed", color: "#fff", borderColor: "#a78bfa" },
  sum: { margin: "14px 0 0", fontSize: "0.95rem" },
  actions: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" },
  primary: {
    border: "none",
    background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  ghost: {
    border: "1px solid #4b5563",
    background: "transparent",
    color: "#e5e7eb",
    padding: "10px 16px",
    borderRadius: 999,
    cursor: "pointer",
  },
  mList: { display: "flex", flexDirection: "column", gap: 10 },
  mRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1f2937",
    paddingBottom: 10,
  },
  mName: { fontWeight: 800 },
  mPrice: { fontSize: "0.8rem", color: "#9ca3af" },
  mQty: { display: "flex", alignItems: "center", gap: 8 },
  mini: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#111827",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  muted: { fontSize: "0.8rem", color: "#9ca3af" },
  ul: { listStyle: "none", padding: 0, margin: "0 0 12px" },
  li: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid #1f2937",
  },
  t: { fontWeight: 800 },
  p: { fontWeight: 900, color: "#fcd34d" },
  danger: {
    border: "1px solid #7f1d1d",
    background: "transparent",
    color: "#fca5a5",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: "0.78rem",
    cursor: "pointer",
  },
  foot: {
    padding: "16px",
    fontSize: "0.72rem",
    color: "#6b7280",
    textAlign: "center",
  },
};
