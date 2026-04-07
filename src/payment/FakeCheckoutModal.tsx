import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatKrw } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

export type CheckoutLine = {
  label: string;
  detail?: string;
  won: number;
};

type Props = {
  open: boolean;
  title: string;
  lines: CheckoutLine[];
  onClose: () => void;
  /** 확인 버튼 클릭 시에만 호출 — 영수증 표시 후 장바구니 비우기 등 */
  onPaid: () => void;
  successTitle?: string;
  successSubtitle?: string;
};

export default function FakeCheckoutModal({
  open,
  title,
  lines,
  onClose,
  onPaid,
  successTitle = "결제가 완료되었습니다",
  successSubtitle = "데모용 전자영수증이 발급되었습니다. 아래 내용을 확인해 주세요.",
}: Props) {
  const { isAdmin } = useAuth();
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [msg, setMsg] = useState<string | null>(null);
  const payTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setMsg(null);
    } else if (payTimerRef.current) {
      clearTimeout(payTimerRef.current);
      payTimerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const total = lines.reduce((s, l) => s + l.won, 0);

  const startPay = () => {
    setMsg(null);
    if (!isAdmin) {
      setMsg(
        "결제 시스템 점검 중입니다. 예매·주문 확정은 관리자 로그인(ksh011) 후에만 가능합니다."
      );
      return;
    }
    if (payTimerRef.current) {
      clearTimeout(payTimerRef.current);
      payTimerRef.current = null;
    }
    setStep("processing");
    payTimerRef.current = window.setTimeout(() => {
      payTimerRef.current = null;
      setStep("done");
    }, 900);
  };

  const abortProcessing = () => {
    if (payTimerRef.current) {
      clearTimeout(payTimerRef.current);
      payTimerRef.current = null;
    }
    setStep("form");
    setMsg(null);
  };

  const close = () => {
    if (payTimerRef.current) {
      clearTimeout(payTimerRef.current);
      payTimerRef.current = null;
    }
    setStep("form");
    setMsg(null);
    onClose();
  };

  const confirmDone = () => {
    onPaid();
    close();
  };

  return (
    <div style={st.root} role="dialog" aria-modal="true" aria-labelledby="pay-title">
      <button type="button" style={st.backdrop} aria-label="닫기" onClick={close} />
      <div style={st.panel}>
        {step !== "done" ? (
          <h2 id="pay-title" style={st.title}>
            {title}
          </h2>
        ) : null}

        {!isAdmin && step === "form" && (
          <p style={st.warn}>
            현재 <strong>비로그인 또는 권한 없음</strong> — 데모 정책상{" "}
            <strong>관리자만 가짜 결제 완료</strong>가 됩니다.
          </p>
        )}
        {isAdmin && step === "form" && (
          <p style={st.ok}>관리자 세션: PG 없이 데모 승인이 진행됩니다.</p>
        )}

        {step === "form" && (
          <>
            <ul style={st.lines}>
              {lines.map((l, i) => (
                <li key={i} style={st.line}>
                  <div>
                    <div style={st.lineLab}>{l.label}</div>
                    {l.detail ? <div style={st.lineDet}>{l.detail}</div> : null}
                  </div>
                  <div style={st.lineWon}>{formatKrw(l.won)}</div>
                </li>
              ))}
            </ul>
            <p style={st.total}>
              합계 <strong>{formatKrw(total)}</strong>
            </p>
            <div style={st.fakeFields}>
              <label style={st.lbl}>
                카드번호 (데모)
                <input style={st.inp} defaultValue="4330-1234-5678-9010" readOnly />
              </label>
              <label style={st.lbl}>
                유효기간
                <input style={st.inp} defaultValue="12/28" readOnly />
              </label>
              <label style={st.lbl}>
                CVC
                <input style={st.inp} defaultValue="***" readOnly />
              </label>
            </div>
            {msg ? <p style={st.err}>{msg}</p> : null}
            <div style={st.actions}>
              <button type="button" style={st.ghost} onClick={close}>
                취소
              </button>
              <button type="button" style={st.primary} onClick={startPay}>
                {isAdmin ? "결제하기(데모)" : "결제 시도"}
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div style={st.processingBox}>
            <p style={st.center}>결제 승인 중… (가짜 PG)</p>
            <button type="button" style={st.ghost} onClick={abortProcessing}>
              취소 · 승인 중단
            </button>
          </div>
        )}

        {step === "done" && (
          <div style={st.doneWrap}>
            <div style={st.doneHero} aria-hidden>
              <span style={st.doneCheck}>✓</span>
            </div>
            <h2 style={st.doneHeadline}>{successTitle}</h2>
            <p style={st.doneSub}>{successSubtitle}</p>
            <div style={st.receiptCard}>
              <p style={st.receiptLabel}>결제 요약</p>
              <ul style={st.receiptList}>
                {lines.map((l, i) => (
                  <li key={i} style={st.receiptRow}>
                    <span>
                      <span style={st.receiptName}>{l.label}</span>
                      {l.detail ? (
                        <span style={st.receiptDet}>{l.detail}</span>
                      ) : null}
                    </span>
                    <span style={st.receiptWon}>{formatKrw(l.won)}</span>
                  </li>
                ))}
              </ul>
              <p style={st.receiptTotal}>
                합계 <strong>{formatKrw(total)}</strong>
              </p>
            </div>
            <button type="button" style={st.primaryWide} onClick={confirmDone}>
              확인 · 닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    border: "none",
    cursor: "pointer",
  },
  panel: {
    position: "relative",
    width: "min(100%, 440px)",
    background: "#fff",
    color: "#111",
    borderRadius: 18,
    padding: "22px 20px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
    maxHeight: "90vh",
    overflow: "auto",
  },
  title: { margin: "0 0 12px", fontSize: "1.1rem", fontWeight: 800 },
  warn: {
    margin: "0 0 12px",
    fontSize: "0.82rem",
    lineHeight: 1.5,
    color: "#7c2d12",
    background: "#fff7ed",
    padding: "10px 12px",
    borderRadius: 10,
  },
  ok: {
    margin: "0 0 12px",
    fontSize: "0.82rem",
    color: "#14532d",
    background: "#ecfdf3",
    padding: "10px 12px",
    borderRadius: 10,
  },
  lines: { listStyle: "none", padding: 0, margin: "0 0 8px" },
  line: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #eee",
    fontSize: "0.88rem",
  },
  lineLab: { fontWeight: 600 },
  lineDet: { fontSize: "0.75rem", color: "#666", marginTop: 2 },
  lineWon: { fontWeight: 700, whiteSpace: "nowrap" },
  total: { margin: "8px 0 12px", fontSize: "0.95rem" },
  fakeFields: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 },
  lbl: { fontSize: "0.72rem", color: "#555", display: "flex", flexDirection: "column", gap: 4 },
  inp: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: "0.85rem",
  },
  err: { color: "#b91c1c", fontSize: "0.82rem", margin: "0 0 10px" },
  actions: { display: "flex", justifyContent: "flex-end", gap: 8 },
  ghost: {
    border: "1px solid #ccc",
    background: "#fff",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 700,
  },
  primary: {
    border: "none",
    background: "linear-gradient(135deg,#fb7185,#f43f5e)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 800,
  },
  center: { textAlign: "center", padding: "12px 0 8px", fontWeight: 600 },
  processingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "8px 0 4px",
  },
  doneWrap: { textAlign: "center", padding: "4px 0 0" },
  doneHero: {
    width: 64,
    height: 64,
    margin: "0 auto 14px",
    borderRadius: "50%",
    background: "linear-gradient(145deg,#22c55e,#16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 32px rgba(22,163,74,0.35)",
  },
  doneCheck: {
    color: "#fff",
    fontSize: "2rem",
    fontWeight: 800,
    lineHeight: 1,
  },
  doneHeadline: {
    margin: "0 0 8px",
    fontSize: "1.25rem",
    fontWeight: 800,
    lineHeight: 1.35,
  },
  doneSub: {
    margin: "0 0 16px",
    color: "#555",
    fontSize: "0.86rem",
    lineHeight: 1.55,
  },
  receiptCard: {
    textAlign: "left",
    border: "1px solid #e8e8e8",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 16,
    background: "#fafafa",
  },
  receiptLabel: {
    margin: "0 0 8px",
    fontSize: "0.72rem",
    fontWeight: 800,
    color: "#666",
    letterSpacing: "0.06em",
  },
  receiptList: { listStyle: "none", padding: 0, margin: 0 },
  receiptRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: "0.82rem",
    padding: "6px 0",
    borderBottom: "1px solid #eee",
  },
  receiptName: { fontWeight: 600, display: "block" },
  receiptDet: { display: "block", fontSize: "0.72rem", color: "#777", marginTop: 2 },
  receiptWon: { fontWeight: 700, whiteSpace: "nowrap" },
  receiptTotal: { margin: "10px 0 0", fontSize: "0.95rem", textAlign: "right" },
  primaryWide: {
    border: "none",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 999,
    fontWeight: 800,
    width: "100%",
    fontSize: "0.95rem",
  },
};
