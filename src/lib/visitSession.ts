const TAB_KEY = "sehyeon_tab_visit_ms";
const LAST_KEY = "sehyeon_last_visit_ms";

export type MallVisitInfo = {
  /** 이 브라우저 탭을 연 시각(새로고침해도 유지) */
  tabSessionAt: Date;
  /** 직전에 이 사이트(몰)를 연 시각. 첫 방문이면 null */
  previousVisitAt: Date | null;
};

/**
 * 몰 진입 시 한 번 호출. 직전 방문 시각을 읽은 뒤, 이번 시각을 저장합니다.
 */
export function readAndRecordMallVisit(): MallVisitInfo {
  const now = Date.now();

  let tabMs = sessionStorage.getItem(TAB_KEY);
  if (!tabMs) {
    tabMs = String(now);
    sessionStorage.setItem(TAB_KEY, tabMs);
  }

  const prevRaw = localStorage.getItem(LAST_KEY);
  const previousVisitAt =
    prevRaw && !Number.isNaN(Number(prevRaw))
      ? new Date(Number(prevRaw))
      : null;

  localStorage.setItem(LAST_KEY, String(now));

  return {
    tabSessionAt: new Date(Number(tabMs)),
    previousVisitAt,
  };
}

export function formatVisitKo(d: Date): string {
  return d.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
