import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { pickRandomConcertTrack, type ConcertTrack } from "./concertTracks";
import { startProceduralFarewellAmbient } from "../mall/proceduralMallSound";
import { fadeOutAndTeardownAudio } from "../lib/fadeOutHtmlAudio";

/** 콘서트 탭 전용 BGM — 클릭 후 Web Audio → Mixkit 풀 트랙. */
export default function ConcertAmbientDock() {
  const trackRef = useRef<ConcertTrack | null>(null);
  if (!trackRef.current) trackRef.current = pickRandomConcertTrack();
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
    el.volume = 0.24;
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.style.display = "none";
    document.body.appendChild(el);
    el.src = track.url;
    audioRef.current = el;

    const switchToFile = () => {
      if (fileAttemptRef.current !== attempt) return;
      void el.play().then(
        () => {
          if (fileAttemptRef.current !== attempt) return;
          if (stopProcRef.current) {
            stopProcRef.current();
            stopProcRef.current = null;
          }
          setMode("file");
        },
        () => {
          if (fileAttemptRef.current !== attempt) return;
          setErr("스트리밍 재생에 실패했습니다. Web Audio 앰비언트를 계속 듣습니다.");
        }
      );
    };

    const onError = () => {
      if (fileAttemptRef.current !== attempt) return;
      setErr("BGM 파일을 불러오지 못했습니다. Web Audio 앰비언트를 유지합니다.");
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
      aria-label="콘서트 배경 음악"
      aria-live="polite"
    >
      <div style={st.card}>
        <p style={st.title}>콘서트 BGM</p>
        <p style={st.sub}>
          이번 방문 랜덤: <strong>{track.title}</strong>
          <br />
          <span style={st.hint}>
            {mode === "proc"
              ? "이별 톤 Web Audio 또는 스트리밍 대기"
              : mode === "file"
                ? "Mixkit 스트리밍 (잔잔·서정)"
                : "「BGM 켜기」로 감성 BGM"}
          </span>
        </p>
        {err ? <p style={st.err}>{err}</p> : null}
        <button
          type="button"
          style={st.btn}
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? "콘서트 배경음 끄기" : "콘서트 배경음 켜기"}
        >
          {playing ? "BGM 끄기" : "BGM 켜기"}
        </button>
        <p style={st.note}>몰·시네마로 이동하면 콘서트가 닫히며 BGM이 멈춥니다.</p>
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
    maxWidth: 268,
  },
  card: {
    background: "linear-gradient(165deg, rgba(30,27,75,0.97), rgba(15,23,42,0.98))",
    border: "1px solid rgba(167,139,250,0.45)",
    borderRadius: 16,
    padding: "12px 14px",
    boxShadow:
      "0 0 0 1px rgba(251,191,36,0.12), 0 16px 48px rgba(88,28,135,0.35)",
  },
  title: { margin: "0 0 6px", fontSize: "0.84rem", fontWeight: 900, color: "#e9d5ff" },
  sub: {
    margin: "0 0 10px",
    fontSize: "0.75rem",
    color: "#a5b4fc",
    lineHeight: 1.45,
  },
  hint: { fontSize: "0.68rem", color: "#818cf8" },
  err: { margin: "0 0 8px", fontSize: "0.72rem", color: "#fca5a5" },
  btn: {
    width: "100%",
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 800,
    fontSize: "0.8rem",
    cursor: "pointer",
    background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    color: "#fff",
  },
  note: { margin: "8px 0 0", fontSize: "0.65rem", color: "#6366f1", lineHeight: 1.4 },
};
