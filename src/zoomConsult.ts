/** PRD v13: Zoom 상담 링크는 발급 시점부터 48시간 유효 */
export const ZOOM_LINK_VALID_MS = 48 * 60 * 60 * 1000;

const STORAGE_KEY = "sehyeon-mall-zoom-consult";

export type ZoomConsultRecord = {
  meetingUrl: string;
  issuedAt: number;
};

export function getZoomConsult(): ZoomConsultRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ZoomConsultRecord;
    if (
      typeof parsed.meetingUrl !== "string" ||
      typeof parsed.issuedAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function issueZoomConsult(meetingUrl: string): ZoomConsultRecord {
  const record: ZoomConsultRecord = {
    meetingUrl,
    issuedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function clearZoomConsult(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function expiresAt(record: ZoomConsultRecord): number {
  return record.issuedAt + ZOOM_LINK_VALID_MS;
}

export function isExpired(record: ZoomConsultRecord, now = Date.now()): boolean {
  return now >= expiresAt(record);
}

/** 데모용 고정 미팅 URL (실제 Zoom 회의 ID로 교체 가능) */
export const DEMO_ZOOM_URL = "https://zoom.us/j/0000000000";
