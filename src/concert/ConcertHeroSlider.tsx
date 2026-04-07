import { useCallback, useEffect, useRef, useState } from "react";

type Slide = { src: string; caption: string };

const SLIDES: Slide[] = [
  {
    src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=82",
    caption: "라이브 공연장 조명 (스톡)",
  },
  {
    src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=82",
    caption: "무대 레이저·빔 분위기 (스톡)",
  },
  {
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=82",
    caption: "이벤트·파티 라이트 (스톡)",
  },
];

const INTERVAL_MS = 4800;
const SPARK_MS = 720;

/**
 * 콘서트 히어로용 자동 슬라이드(모션 줄임이면 첫 장만, 전환 없음).
 * `portalSpark`가 바뀔 때·도트 클릭 시 짧은 라이트 플래시 연출.
 */
export default function ConcertHeroSlider({
  portalSpark = 0,
}: {
  portalSpark?: number;
}) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportSpark, setViewportSpark] = useState(false);
  const pauseRef = useRef(false);
  const sparkTimerRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || SLIDES.length < 2) return;
    const id = window.setInterval(() => {
      if (pauseRef.current) return;
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const triggerSpark = useCallback(() => {
    if (reducedMotion) return;
    setViewportSpark(true);
    if (sparkTimerRef.current) window.clearTimeout(sparkTimerRef.current);
    sparkTimerRef.current = window.setTimeout(() => {
      setViewportSpark(false);
      sparkTimerRef.current = 0;
    }, SPARK_MS);
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      if (sparkTimerRef.current) window.clearTimeout(sparkTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (portalSpark < 1) return;
    triggerSpark();
  }, [portalSpark, triggerSpark]);

  const go = useCallback(
    (i: number) => {
      setIndex(i);
      triggerSpark();
    },
    [triggerSpark]
  );

  const cap = SLIDES[index]?.caption ?? "";

  return (
    <div
      className="concert-hero-slider"
      onMouseEnter={() => {
        pauseRef.current = true;
      }}
      onMouseLeave={() => {
        pauseRef.current = false;
      }}
    >
      <div
        className={`concert-hero-slider-viewport${viewportSpark ? " concert-hero-slider-viewport--spark" : ""}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="공연 분위기 참고 이미지 슬라이드"
      >
        <div
          className="concert-hero-slider-track"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: reducedMotion ? "none" : undefined,
          }}
        >
          {SLIDES.map((s, i) => (
            <div key={s.src} className="concert-hero-slider-slide" aria-hidden={i !== index}>
              <img src={s.src} alt="" width={640} height={800} loading={i === 0 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
      </div>
      {SLIDES.length > 1 ? (
        <div className="concert-hero-slider-dots" role="tablist" aria-label="슬라이드 선택">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`concert-hero-slider-dot${i === index ? " concert-hero-slider-dot--on" : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
      <p className="concert-hero-slider-cap">
        {cap} · 공식 단체 사진 아님
      </p>
    </div>
  );
}
