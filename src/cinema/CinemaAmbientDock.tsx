import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { pickRandomCinemaTrack, type CinemaTrack } from "./cinemaTracks";
import { startProceduralFarewellAmbient } from "../mall/proceduralMallSound";
import { fadeOutAndTeardownAudio } from "../lib/fadeOutHtmlAudio";

/** 시네마 탭 전용 BGM(몰과 동일: 클릭 제스처 후 Web Audio → Mixkit 풀 트랙). */
export default function CinemaAmbientDock() {
  const trackRef = useRef<CinemaTrack | null>(null);
  if (!trackRef.current) trackRef.current = pickRandomCinemaTrack();
  const track = trackRef.current;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopProcRef = useRef<(() => void) | null>(null);
  const fileAttemptRef = useRef(0);

  const [mode, setMode] = useState<"off" | "file" | "proc">("off");
  const [err, setErr] = useState<string | null>(null);

  const stopAll = useCallback(() => {
    const a = audioRef.current;
    audioRef.current = null;
    if (a) {
      if (a.src) {
        fadeOutAndTeardownAudio(a, 300, () => {});
      } else {
        a.pause();
        a.remove();
      }
    }
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
      stopProcRef.current = startProceduralFarewellAmbient();
      setMode("proc");
    } catch {
      setErr("이 브라우저에서 오디오를 시작할 수 없습니다.");
      return;
    }

    const el = document.createElement("audio");
    el.loop = true;
    el.volume = 0.26;
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
    <div
      style={st.wrap}
      role="region"
      aria-label="시네마 배경 음악"
      aria-live="polite"
    >
      <div style={st.card}>
        <p style={st.title}>시네마 BGM</p>
        <p style={st.sub}>
          이번 방문 랜덤 트랙: <strong>{track.title}</strong>
          <br />
          <span style={st.hint}>
            {mode === "proc"
              ? "스트리밍 대기 중이거나 이별 톤 Web Audio 재생 중"
              : mode === "file"
                ? "Mixkit 스트리밍 (잔잔·서정)"
                : "「BGM 켜기」를 누르면 재생됩니다"}
          </span>
        </p>
        {err ? <p style={st.err}>{err}</p> : null}
        <button
          type="button"
          style={st.btn}
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? "시네마 배경음 끄기" : "시네마 배경음 켜기"}
        >
          {playing ? "BGM 끄기" : "BGM 켜기"}
        </button>
        <p style={st.note}>
          세현몰·콘서트로 이동하면 시네마가 언마운트되며 BGM이 멈춥니다.
        </p>
      </div>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  wrap: {
    position: "fixed",
    right: 16,
    bottom: "max(16px, env(safe-area-inset-bottom, 0px))",
    zIndex: 60,
    maxWidth: 260,
  },
  card: {
    background: "linear-gradient(165deg, rgba(24,24,36,0.97), rgba(12,12,20,0.98))",
    border: "1px solid rgba(244,63,94,0.35)",
    borderRadius: 14,
    padding: "12px 14px",
    boxShadow:
      "0 0 0 1px rgba(251,191,36,0.12), 0 16px 48px rgba(0,0,0,0.55)",
  },
  title: { margin: "0 0 6px", fontSize: "0.82rem", fontWeight: 800, color: "#fef3c7" },
  sub: {
    margin: "0 0 10px",
    fontSize: "0.75rem",
    color: "#a8a8b8",
    lineHeight: 1.45,
  },
  hint: { fontSize: "0.68rem", color: "#71718a" },
  err: { margin: "0 0 8px", fontSize: "0.72rem", color: "#fca5a5" },
  btn: {
    width: "100%",
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 800,
    fontSize: "0.8rem",
    cursor: "pointer",
    background: "linear-gradient(135deg,#fb7185,#f43f5e)",
    color: "#fff",
  },
  note: { margin: "8px 0 0", fontSize: "0.65rem", color: "#6b6b7a", lineHeight: 1.4 },
};
