import { useEffect, useState } from "react";

const STORAGE_KEY = "sehyeon_celebration_v1";

/**
 * 브라우저 탭당 한 번, 짧은 컨페티 연출(모션 줄임이면 생략).
 * 데모 첫인상용 — 포인터 이벤트 없음.
 */
export default function SehyeonSessionCelebration() {
  const [phase, setPhase] = useState<"off" | "on" | "done">("off");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setPhase("on");
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* noop */
      }
      setPhase("done");
    }, 3200);
    return () => window.clearTimeout(t);
  }, []);

  if (phase !== "on") return null;

  return (
    <div className="sehyeon-session-celebration" aria-hidden>
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          className={`sehyeon-session-celebration__bit sehyeon-session-celebration__bit--${i % 6}`}
          style={{ animationDelay: `${i * 0.04}s` }}
        />
      ))}
    </div>
  );
}
