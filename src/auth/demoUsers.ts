/**
 * 로컬 수업/데모 전용 — 클라이언트 하드코딩 계정이므로 실서비스에 절대 사용 금지.
 */
export const ADMIN_USERNAME = "ksh011";
/** 데모 전용 — 요청하신 관리자 비밀번호 */
export const ADMIN_PASSWORD = "lms990302!!";

export type DemoRole = "admin" | "guest";

export type DemoUser = {
  username: string;
  role: DemoRole;
  displayName: string;
};

export function matchAdmin(username: string, password: string): boolean {
  return (
    username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD
  );
}
