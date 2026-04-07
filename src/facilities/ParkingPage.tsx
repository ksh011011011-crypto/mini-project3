import { useMemo, useState, type CSSProperties } from "react";

type Level = { id: string; label: string; total: number };

const LEVELS: Level[] = [
  { id: "b3", label: "B3 (심야·장기)", total: 86 },
  { id: "b2", label: "B2 (일반)", total: 124 },
  { id: "b1", label: "B1 (단기·픽업)", total: 48 },
];

function randomTaken(total: number, seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const ratio = 0.35 + (h % 40) / 100;
  return Math.min(total - 2, Math.floor(total * ratio));
}

export default function ParkingPage({ onBack }: { onBack: () => void }) {
  const [dayKey] = useState(() => new Date().toDateString());
  const stats = useMemo(
    () =>
      LEVELS.map((L) => {
        const taken = randomTaken(L.total, `${dayKey}-${L.id}`);
        return { ...L, taken, free: L.total - taken };
      }),
    [dayKey]
  );

  return (
    <div style={st.page}>
      <header style={st.head}>
        <button type="button" style={st.back} onClick={onBack}>
          ← 복합 단지 홈
        </button>
        <div>
          <h1 style={st.h1}>지하 주차장 안내</h1>
          <p style={st.sub}>
            세현몰·시네마·공연장 방문 차량용 데모 현황입니다. 실시간 입출차 연동은
            포함되지 않으며, 숫자는 매일 한 번 고정 시드로 계산됩니다.
          </p>
        </div>
      </header>

      <section style={st.panel} aria-label="층별 잔여 주차면">
        <h2 style={st.h2}>층별 현황 (데모)</h2>
        <ul style={st.list}>
          {stats.map((s) => (
            <li key={s.id} style={st.row}>
              <div>
                <strong>{s.label}</strong>
                <p style={st.meta}>
                  전체 {s.total}면 · 잔여{" "}
                  <span style={st.free}>{s.free}</span>면
                </p>
              </div>
              <div
                style={st.bar}
                role="presentation"
                aria-hidden
              >
                <div
                  style={{
                    ...st.barFill,
                    width: `${Math.round((s.free / s.total) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={st.note}>
        <p>
          <strong>안내:</strong> B1은 세현마트·B1 푸드 연결 통로와 가깝습니다.
          영화 관람객은 B2 진입 후 시네마 전용 엘리베이터(10F) 동선을 이용하는
          설정입니다. 장시간 주차는 B3 구역을 참고하세요.
        </p>
      </section>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(56,189,248,0.12), transparent 50%), linear-gradient(180deg,#0b1220 0%,#111827 45%,#0f172a 100%)",
    color: "#e2e8f0",
    padding: "1.25rem 1rem 2.5rem",
    maxWidth: 720,
    margin: "0 auto",
  },
  head: { marginBottom: "1.35rem" },
  back: {
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(30,41,59,0.8)",
    color: "#bae6fd",
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: "0.78rem",
    fontWeight: 700,
    marginBottom: "0.85rem",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  h1: { margin: "0 0 0.4rem", fontSize: "clamp(1.25rem,4vw,1.5rem)", fontWeight: 800 },
  sub: { margin: 0, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.55 },
  panel: {
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 18,
    padding: "1.15rem 1.2rem",
    marginBottom: "1rem",
    backdropFilter: "blur(10px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  h2: { margin: "0 0 0.75rem", fontSize: "1.02rem", fontWeight: 800 },
  list: { listStyle: "none", padding: 0, margin: 0 },
  row: {
    padding: "0.85rem 0",
    borderBottom: "1px solid #334155",
  },
  meta: { margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#94a3b8" },
  free: { color: "#4ade80", fontWeight: 800 },
  bar: {
    height: 6,
    background: "#334155",
    borderRadius: 999,
    marginTop: "0.5rem",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg,#22c55e,#4ade80)",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  note: {
    fontSize: "0.8rem",
    color: "#cbd5e1",
    lineHeight: 1.65,
    padding: "1rem 1.1rem",
    background: "rgba(30,58,138,0.2)",
    border: "1px solid rgba(96,165,250,0.25)",
    borderRadius: 14,
  },
};
