import { useEffect, useRef } from "react";

/**
 * 버튼·링크 등 클릭(포인터 다운) 시 짧은 빛 번짐. 레이어는 pointer-events: none.
 */
export default function ClickSparkLayer() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    const selector =
      "button, a[href], [role='button'], input[type='button'], input[type='submit'], input[type='reset'], .mall-cart-pill-btn, .mall-nav-link-btn, .sehyeon-chat-fab";

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest(selector)) return;

      const spark = document.createElement("span");
      spark.className = "sehyeon-click-spark";
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
