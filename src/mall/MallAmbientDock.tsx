import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { pickRandomTrack, type MallTrack } from "./mallTracks";
import { startProceduralMallSound } from "./proceduralMallSound";

/**
 * 쇼핑몰 탭에 들어올 때마다 컴포넌트가 새로 마운트되면 트랙이 다시 랜덤으로 고정됩니다.
 * 브라우저 자동재생 정책 때문에, 재생은 반드시 사용자 클릭으로 시작합니다.
 * 클릭 직후 동기적으로 Web Audio를 켠 뒤(제스처 유지), 가능하면 Mixkit 스트리밍으로 갈아탑니다.
 */
export default function MallAmbientDock() {
  const trackRef = useRef<MallTrack | null>(null);
  if (!trackRef.current) {
    trackRef.current = pickRandomTrack();
  }
  const track = trackRef.current;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopProcRef = useRef<(() => void) | null>(null);
  const fileAttemptRef = useRef(0);

  const [mode, setMode] = useState<"off" | "file" | "proc">("off");
  const [err, setErr] = useState<string | null>(null);

  const stopAll = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
      a.remove();
    }
    audioRef.current = null;
    if (stopProcRef.current) {
      stopProcRef.current();
      stopProcRef.current = null;
    }
    setMode("off");
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const startAll = useCallback(() => {
    stopAll();
    setErr(null);
    fileAttemptRef.current += 1;
    const attempt = fileAttemptRef.current;

    try {
      stopProcRef.current = startProceduralMallSound();
      setMode("proc");
    } catch {
      setErr("이 브라우저에서 오디오를 시작할 수 없습니다.");
      return;
    }

    const el = document.createElement("audio");
    el.loop = true;
    el.volume = 0.32;
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.style.display = "none";
    document.body.appendChild(el);
    el.src = track.url;
    audioRef.current = el;

    const switchToFile = () => {
      if (fileAttemptRef.current !== attempt) return;
      void el.play().then(() => {
        if (fileAttemptRef.current !== attempt) return;
        if (stopProcRef.current) {
          stopProcRef.current();
          stopProcRef.current = null;
        }
        setMode("file");
      });
    };

    const onError = () => {
      if (fileAttemptRef.current !== attempt) return;
      el.remove();
      if (audioRef.current === el) audioRef.current = null;
    };

    el.addEventListener("error", onError, { once: true });
    el.addEventListener("canplay", switchToFile, { once: true });
    el.load();
    switchToFile();
  }, [stopAll, track.url]);

  const toggle = () => {
    if (mode !== "off") {
      stopAll();
      setErr(null);
      return;
    }
    startAll();
  };

  const playing = mode !== "off";

  return (
    <div style={st.wrap} aria-live="polite">
      <div style={st.card}>
        <p style={st.title}>쇼핑몰 BGM</p>
        <p style={st.sub}>
          이번 방문 랜덤 트랙: <strong>{track.title}</strong>
          <br />
          <span style={st.hint}>
            {mode === "proc"
              ? "스트리밍 로딩 중이거나, 생성형 앰비언트(Web Audio)로 재생 중"
              : mode === "file"
                ? "Mixkit 프리뷰 스트리밍 재생 중"
                : "「BGM 켜기」를 누르면 바로 소리가 납니다"}
          </span>
        </p>
        {err ? <p style={st.err}>{err}</p> : null}
        <button type="button" style={st.btn} onClick={toggle}>
          {playing ? "BGM 끄기" : "BGM 켜기"}
        </button>
        <p style={st.note}>
          시네마·콘서트로 이동하면 쇼핑몰이 사라지며 BGM이 자동으로 멈춥니다. 다시
          들어오면 다른 트랙이 뽑힙니다.
        </p>
      </div>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  wrap: {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 60,
    maxWidth: 260,
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "12px 14px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
  },
  title: { margin: "0 0 6px", fontSize: "0.82rem", fontWeight: 800 },
  sub: {
    margin: "0 0 10px",
    fontSize: "0.75rem",
    color: "var(--muted)",
    lineHeight: 1.45,
  },
  hint: { fontSize: "0.68rem", color: "#888" },
  err: { margin: "0 0 8px", fontSize: "0.72rem", color: "#b91c1c" },
  btn: {
    width: "100%",
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 800,
    fontSize: "0.8rem",
    cursor: "pointer",
    background: "var(--accent)",
    color: "#fff",
  },
  note: { margin: "8px 0 0", fontSize: "0.65rem", color: "#999", lineHeight: 1.4 },
};
