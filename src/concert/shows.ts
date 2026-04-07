import { ALL_SEAT_IDS } from "../cinema/screenings";
import type { ConcertShow } from "./types";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickOccupied(seed: string, n: number): string[] {
  const shuffled = [...ALL_SEAT_IDS].sort(
    (a, b) => hash(seed + a) - hash(seed + b)
  );
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/** 오늘 기준으로 잡히는 회차 2개 (지난 시각이면 내일로 밀기) */
export function buildConcertShows(now = new Date()): ConcertShow[] {
  const mk = (dayPlus: number, hour: number, minute: number, suffix: string) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayPlus);
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() < now.getTime()) {
      d.setDate(d.getDate() + 1);
    }
    const id = `lsrf-${suffix}-${d.toISOString().slice(0, 10)}`;
    return { d, id };
  };

  const a = mk(0, 19, 0, "m1");
  const b = mk(0, 21, 30, "m2");

  const titleKo = "LE SSERAFIM 무대인사 & 미니콘서트";
  const titleEn = "LE SSERAFIM Stage Greeting + Mini Live";

  const mkShow = (x: { d: Date; id: string }, occ: number): ConcertShow => ({
    id: x.id,
    titleKo,
    titleEn,
    venue: "예술의전당",
    hall: "오페라극장",
    startAt: x.d.toISOString(),
    basePrice: 132000,
    occupiedSeatIds: pickOccupied(x.id, occ),
    fanScore: 4.6 + (hash(x.id) % 5) * 0.08,
  });

  return [
    mkShow(a, 14 + (hash(a.id) % 12)),
    mkShow(b, 16 + (hash(b.id) % 10)),
  ];
}

export const CONCERT_MERCH = [
  { id: "light", name: "공식 응원봉 (피어리스)", price: 35000 },
  { id: "poster", name: "한정 포스터 세트", price: 22000 },
  { id: "pc", name: "포토카드 랜덤 3종", price: 15000 },
] as const;
