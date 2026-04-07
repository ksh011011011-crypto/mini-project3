import { ALL_HALLS, basePriceForHall } from "./hallInfo";
import { MOVIES } from "./movies";
import type { Screening } from "./types";

/** 하루 전체 후보 슬롯(시) — 실제 회차 수는 작품·날짜 시드로 가려짐 */
const SLOT_HOURS = [
  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 행 A–H, 열 1–12 */
export const ALL_SEAT_IDS: string[] = (() => {
  const rows = "ABCDEFGH".split("");
  const out: string[] = [];
  for (const r of rows) {
    for (let c = 1; c <= 12; c++) out.push(`${r}${c}`);
  }
  return out;
})();

function pickOccupied(seed: string, count: number): string[] {
  const shuffled = [...ALL_SEAT_IDS].sort(
    (a, b) => hash(seed + a) - hash(seed + b)
  );
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

function atHour(base: Date, hour: number, minute: number): Date {
  const x = new Date(base);
  x.setHours(hour, minute, 0, 0);
  return x;
}

function pickSlotHours(seed: string, count: number): number[] {
  const shuffled = [...SLOT_HOURS].sort(
    (a, b) => hash(seed + a) - hash(seed + b)
  );
  const n = Math.min(count, shuffled.length);
  return shuffled.slice(0, n).sort((a, b) => a - b);
}

/** 오늘 기준 0~6일, 한국형 상영 슬롯 생성 */
export function buildSchedule(now = new Date()): Screening[] {
  const out: Screening[] = [];
  for (let day = 0; day < 7; day++) {
    const dayStart = addDays(now, day);
    for (const movie of MOVIES) {
      if (movie.releaseStatus !== "now") continue;
      const slotCount = 5 + (hash(movie.id + day) % 4);
      const chosenSlots = pickSlotHours(movie.id + String(day), slotCount);
      for (const hour of chosenSlots) {
        const hall =
          ALL_HALLS[hash(movie.id + day + hour) % ALL_HALLS.length];
        const half = hash(movie.id + day + hour + "m") % 2 === 1;
        const minute =
          half && hour >= 10 && hour <= 21 ? 30 : 0;
        const start = atHour(dayStart, hour, minute);
        const id = `sc-${movie.id}-d${day}-t${start.getTime()}-${hall}`;
        const basePrice = basePriceForHall(hall);
        const weekend = dayStart.getDay() === 0 || dayStart.getDay() === 6;
        const price = weekend && hour >= 18 ? basePrice + 2000 : basePrice;
        const occCount = 8 + (hash(id) % 18);
        out.push({
          id,
          movieId: movie.id,
          startAt: start.toISOString(),
          hall,
          basePrice: price,
          occupiedSeatIds: pickOccupied(id, occCount),
        });
      }
    }
  }
  return out;
}

export function screeningsForMovieDay(
  schedule: Screening[],
  movieId: string,
  dayIndex: number,
  now = new Date()
): Screening[] {
  const dayStart = addDays(now, dayIndex);
  const next = addDays(now, dayIndex + 1);
  return schedule.filter((s) => {
    if (s.movieId !== movieId) return false;
    const t = new Date(s.startAt).getTime();
    return t >= dayStart.getTime() && t < next.getTime();
  });
}

export function movieById(id: string) {
  return MOVIES.find((m) => m.id === id) ?? MOVIES[0];
}
