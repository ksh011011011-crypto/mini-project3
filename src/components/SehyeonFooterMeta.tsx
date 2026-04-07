import { useEffect, useMemo, useState } from "react";

const SESSION_KEY = "sehyeon_app_tab_open_ms";

function tabOpenedAt(): Date {
  if (typeof window === "undefined") return new Date();
  let raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    raw = String(Date.now());
    sessionStorage.setItem(SESSION_KEY, raw);
  }
  const ms = Number(raw);
  return Number.isFinite(ms) ? new Date(ms) : new Date();
}

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0) return `${h}시간 ${min}분`;
  return `${m}분`;
}

/** 데모용 단지 정보(가상). */
const DEMO_ADDRESS = "서울특별시 영등포구 세현로 12, 세현타워 (데모 주소)";
const DEMO_PHONE = "02-7890-1234";
const DEMO_FAX = "02-7890-1235";
const DEMO_EMAIL = "info@sehyeon-complex.demo";
const DEMO_HOURS = "고객 안내 09:00 – 22:00 (연중무휴 · 데모)";

export default function SehyeonFooterMeta() {
  const [started] = useState(() => tabOpenedAt());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(id);
  }, []);

  const openedLabel = useMemo(
    () =>
      started.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [started]
  );

  const currentClock = useMemo(
    () =>
      new Date(now).toLocaleString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    [now]
  );

  const elapsed = formatElapsed(now - started.getTime());

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}${window.location.search || ""}`
      : "";

  return (
    <div className="sehyeon-footer-meta">
      <p className="sehyeon-footer-meta-session">
        <span className="sehyeon-footer-meta-label">이 탭 접속</span>{" "}
        <time dateTime={started.toISOString()}>{openedLabel}</time>
        <span className="sehyeon-footer-meta-sep">·</span>
        <span className="sehyeon-footer-meta-label">접속 경과</span> 약 {elapsed}
        <span className="sehyeon-footer-meta-sep">·</span>
        <span className="sehyeon-footer-meta-label">현재 시각</span> {currentClock}
      </p>
      <address className="sehyeon-footer-meta-contact">
        <span className="sehyeon-footer-meta-label">주소</span> {DEMO_ADDRESS}
        <br />
        <span className="sehyeon-footer-meta-label">연락</span> Tel {DEMO_PHONE} · Fax{" "}
        {DEMO_FAX} · {DEMO_EMAIL}
        <br />
        <span className="sehyeon-footer-meta-hours">{DEMO_HOURS}</span>
      </address>
      {pageUrl ? (
        <p className="sehyeon-footer-meta-url">
          <span className="sehyeon-footer-meta-label">접속 URL</span>{" "}
          <span className="sehyeon-footer-meta-url-text" title={pageUrl}>
            {pageUrl}
          </span>
        </p>
      ) : null}
    </div>
  );
}
