import { useEffect, useRef } from "react";

/**
 * 화면 아무 곳이나 주 클릭(포인터 다운)마다 짧은 광점 연출(8종 순환).
 * 특정 요소만 끄려면 `data-no-click-spark` 를 두면 됩니다.
 * 레이어는 pointer-events: none.
 */
export default function ClickSparkLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const variantRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-no-click-spark]")) return;

      const spark = document.createElement("span");
      const v = variantRef.current % 8;
      variantRef.current += 1;
      spark.className = `sehyeon-click-spark sehyeon-click-spark--v${v}`;
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      layer.appendChild(spark);
      spark.addEventListener("animationend", () => spark.remove(), { once: true });
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return <div ref={layerRef} className="sehyeon-click-spark-layer" aria-hidden />;
}
