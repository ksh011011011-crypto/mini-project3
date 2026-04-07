import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  localAiReply,
  typingDelayMs,
  type BrainContext,
  type ChatbotPortal,
} from "./localChatbotBrain";

export type { ChatbotPortal };

type Msg = { id: string; role: "user" | "bot"; text: string; welcome?: boolean };

function welcomeText(portal: ChatbotPortal): string {
  const where =
    portal === "mall"
      ? "🛍️ 지금 화면은 **세현몰**이에요. 층별 쇼핑·식당가·B1 마트까지 편하게 짚어 드릴게요."
      : portal === "cinema"
        ? "🎬 지금 화면은 **세현 시네마**예요. 무비차트·시간표·매점·예매 흐름을 같이 볼 수 있어요."
        : "🎤 지금 화면은 **콘서트**예요. 회차·좌석·MD·결제 순서를 차근차근 안내할게요.";
  return [
    "✨🌟 **환영합니다!** 세현 복합 단지 사이트에 오신 걸 진심으로 환영해요 🙌",
    "",
    where,
    "",
    "💬 인사만 해 주셔도 시간대에 맞춰 답해 드리고, 주차·예매·결제·쇼핑·공연처럼 **키워드 한두 개**만 적어 주셔도 돼요.",
    "🔒 외부 API 없이 **이 브라우저 안에서만** 응답해요. (로컬 안내 데모입니다)",
    "",
    "💪 힘내세요 — 거의 다 왔어요! 오늘 둘러보시는 동안 즐거운 시간 되세요 🎉",
  ].join("\n");
}

function WelcomeRich({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 ? <br /> : null}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) => {
            if (/^\*\*[^*]+\*\*$/.test(part)) {
              return <strong key={pi}>{part.slice(2, -2)}</strong>;
            }
            return <span key={pi}>{part}</span>;
          })}
        </span>
      ))}
    </>
  );
}

const shell: Record<string, CSSProperties> = {
  fab: {
    position: "fixed",
    left: 16,
    bottom: 16,
    zIndex: 200,
    width: 54,
    height: 54,
    borderRadius: "50%",
    color: "#ecfdf5",
    fontSize: "1.35rem",
    cursor: "pointer",
    lineHeight: 1,
  },
  panel: {
    position: "fixed",
    left: 16,
    bottom: 86,
    zIndex: 199,
    width: "min(100vw - 32px, 340px)",
    maxHeight: "min(70vh, 420px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  head: {
    padding: "11px 14px",
    borderBottom: "1px solid rgba(127, 29, 29, 0.45)",
    fontWeight: 800,
    fontSize: "0.88rem",
    letterSpacing: "-0.02em",
    color: "#fef3c7",
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
  },
  sub: {
    fontWeight: 500,
    color: "rgba(253, 230, 224, 0.82)",
    fontSize: "0.68rem",
    marginTop: 4,
    lineHeight: 1.4,
  },
  log: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "92%",
    padding: "9px 12px",
    borderRadius: "14px 14px 4px 14px",
    background: "linear-gradient(145deg, rgba(15,118,110,0.55), rgba(6,78,59,0.45))",
    border: "1px solid rgba(45,212,191,0.35)",
    fontSize: "0.8rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    color: "#ecfdf5",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
  },
  bubbleBot: {
    alignSelf: "flex-start",
    maxWidth: "96%",
    padding: "9px 12px",
    borderRadius: "14px 14px 14px 4px",
    background: "rgba(12, 18, 16, 0.92)",
    border: "1px solid rgba(185, 28, 28, 0.35)",
    fontSize: "0.78rem",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    color: "#e7e5e4",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  thinking: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    padding: "9px 13px",
    borderRadius: 12,
    background: "rgba(76, 29, 149, 0.15)",
    border: "1px solid rgba(167, 139, 250, 0.35)",
    fontSize: "0.74rem",
    color: "#e9d5ff",
    fontStyle: "normal",
  },
  form: {
    display: "flex",
    gap: 8,
    padding: "10px 10px",
    borderTop: "1px solid rgba(20, 83, 73, 0.45)",
    background: "linear-gradient(180deg, rgba(8,12,10,0.98), rgba(5,8,7,0.99))",
  },
  input: {
    flex: 1,
    borderRadius: 10,
    border: "1px solid rgba(127, 29, 29, 0.4)",
    background: "rgba(0,0,0,0.35)",
    color: "#fafaf9",
    padding: "9px 11px",
    fontSize: "0.8rem",
    outline: "none",
  },
  send: {
    borderRadius: 10,
    border: "1px solid rgba(185, 28, 28, 0.5)",
    background: "linear-gradient(180deg, #b91c1c, #7f1d1d)",
    color: "#fffbeb",
    fontWeight: 800,
    fontSize: "0.74rem",
    padding: "0 14px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(127, 29, 29, 0.35)",
  },
};

type Props = { portal: ChatbotPortal };

const initialCtx = (): BrainContext => ({
  lastIntentId: null,
  turnIndex: 0,
  greetExchangeCount: 0,
});

export default function SehyeonChatbot({ portal }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: "welcome", role: "bot", text: welcomeText(portal), welcome: true },
  ]);
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<BrainContext>(initialCtx());
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (thinkTimerRef.current) {
      window.clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
    setThinking(false);
    ctxRef.current = initialCtx();
    setMsgs([{ id: `welcome-${portal}`, role: "bot", text: welcomeText(portal), welcome: true }]);
  }, [portal]);

  useEffect(() => {
    return () => {
      if (thinkTimerRef.current) window.clearTimeout(thinkTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, thinking]);

  const push = useCallback((role: "user" | "bot", t: string) => {
    setMsgs((m) => [...m, { id: `${Date.now()}-${Math.random()}`, role, text: t }]);
  }, []);

  const submit = useCallback(() => {
    const q = text.trim();
    if (!q || thinking) return;
    push("user", q);
    setText("");

    const { text: answer, intentId, bumpGreetCount } = localAiReply(q, portal, ctxRef.current);
    const prev = ctxRef.current;
    ctxRef.current = {
      lastIntentId: intentId ?? prev.lastIntentId,
      turnIndex: prev.turnIndex + 1,
      greetExchangeCount: bumpGreetCount ? prev.greetExchangeCount + 1 : prev.greetExchangeCount,
    };

    if (thinkTimerRef.current) window.clearTimeout(thinkTimerRef.current);
    setThinking(true);
    const delay = typingDelayMs(answer.length);
    thinkTimerRef.current = window.setTimeout(() => {
      thinkTimerRef.current = null;
      setThinking(false);
      push("bot", answer);
    }, delay);
  }, [text, portal, push, thinking]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const portalLabel =
    portal === "mall" ? "세현몰" : portal === "cinema" ? "세현 시네마" : "콘서트";

  return (
    <>
      <button
        type="button"
        className="sehyeon-chat-fab sehyeon-kimetsu-fab"
        style={shell.fab}
        aria-expanded={open}
        aria-controls={`${id}-chat-panel`}
        onClick={() => setOpen((v) => !v)}
        title="세현 안내 (로컬) — 환영 인사 ✨"
      >
        <span className="sehyeon-kimetsu-fab-emojis" aria-hidden>
          🎋💬
        </span>
      </button>
      {open ? (
        <div
          id={`${id}-chat-panel`}
          className="sehyeon-kimetsu-chat-panel"
          style={shell.panel}
          role="dialog"
          aria-label="세현 안내"
        >
          <div className="sehyeon-kimetsu-chat-head" style={shell.head}>
            <span className="sehyeon-kimetsu-chat-head-title" aria-hidden>
              ✨
            </span>{" "}
            세현 안내 · 연{" "}
            <span className="sehyeon-kimetsu-chat-head-title" aria-hidden>
              🌸
            </span>
            <div style={shell.sub}>
              {portalLabel} · 외부 API 없음 · 로컬 응답 · 언제든 인사 환영 💛
            </div>
          </div>
          <div ref={logRef} style={shell.log}>
            {msgs.map((m) => (
              <div
                key={m.id}
                className={
                  m.welcome
                    ? "sehyeon-kimetsu-welcome-bubble"
                    : m.role === "bot"
                      ? "sehyeon-kimetsu-bot-bubble"
                      : undefined
                }
                style={m.role === "user" ? shell.bubbleUser : shell.bubbleBot}
              >
                {m.welcome ? (
                  <WelcomeRich text={m.text} />
                ) : (
                  m.text
                )}
              </div>
            ))}
            {thinking ? (
              <div
                className="sehyeon-kimetsu-thinking"
                style={shell.thinking}
                aria-live="polite"
              >
                ✨ 잠시만요… 답변을 정성껏 정리하고 있어요 📝
              </div>
            ) : null}
          </div>
          <div style={shell.form}>
            <input
              style={shell.input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="👋 인사도 OK! 주차·예매·쇼핑… 궁금한 키워드를 적어 주세요"
              aria-label="챗봇 입력"
              disabled={thinking}
            />
            <button type="button" style={shell.send} onClick={submit} disabled={thinking}>
              전달
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
