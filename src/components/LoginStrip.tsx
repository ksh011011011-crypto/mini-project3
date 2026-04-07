import { useState, type CSSProperties, type FormEvent } from "react";
import { ADMIN_USERNAME } from "../auth/demoUsers";
import { useAuth } from "../auth/AuthContext";

export default function LoginStrip() {
  const { session, isAdmin, login, loginGuest, logout } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!login(u, p)) {
      setErr("아이디/비밀번호가 올바르지 않습니다. (관리자 데모: ksh011)");
      return;
    }
    setU("");
    setP("");
  };

  return (
    <div style={st.wrap}>
      {session ? (
        <div style={st.row}>
          <span style={st.badge}>
            {isAdmin ? "관리자" : "손님"} · {session.user.displayName}
          </span>
          <button type="button" style={st.link} onClick={logout}>
            로그아웃
          </button>
        </div>
      ) : (
        <form style={st.form} onSubmit={submit}>
          <span style={st.hint}>
            예매·주문 확정: 관리자 로그인 (데모 ksh011 / lms990302!!)
          </span>
          <input
            style={st.inp}
            placeholder={`아이디 (예: ${ADMIN_USERNAME})`}
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
          />
          <input
            style={st.inp}
            type="password"
            placeholder="비밀번호"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit" style={st.btn}>
            로그인
          </button>
          <button
            type="button"
            style={st.ghost}
            onClick={() => {
              loginGuest();
              setErr(null);
            }}
          >
            손님(키오스크)
          </button>
          {err ? <span style={st.err}>{err}</span> : null}
        </form>
      )}
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  wrap: { minWidth: 200, maxWidth: 540, flex: "1 1 240px" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  badge: {
    fontSize: "0.72rem",
    color: "#f9fafb",
    background: "linear-gradient(135deg, rgba(55,65,81,0.9), rgba(31,41,55,0.95))",
    padding: "6px 12px",
    borderRadius: 999,
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  link: {
    border: "none",
    background: "transparent",
    color: "#93c5fd",
    fontSize: "0.72rem",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  hint: {
    fontSize: "0.62rem",
    color: "#9ca3af",
    width: "100%",
    textAlign: "right",
    lineHeight: 1.4,
  },
  inp: {
    width: 108,
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    color: "#f9fafb",
    fontSize: "0.72rem",
  },
  btn: {
    border: "none",
    background: "linear-gradient(135deg, #fb7185, #e11d48)",
    color: "#fff",
    padding: "7px 14px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.72rem",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(225,29,72,0.35)",
  },
  ghost: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.04)",
    color: "#e5e7eb",
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: "0.7rem",
    cursor: "pointer",
  },
  err: { fontSize: "0.62rem", color: "#fca5a5", width: "100%", textAlign: "right" },
};
