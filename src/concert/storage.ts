import type { ConcertBooking } from "./types";

const KEY = "sehyeon-concert-bookings";

export function loadConcertBookings(): ConcertBooking[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as ConcertBooking[];
    if (!Array.isArray(p)) return [];
    return p.filter((b) => b && typeof b.id === "string" && Array.isArray(b.seats));
  } catch {
    return [];
  }
}

export function saveConcertBookings(list: ConcertBooking[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addConcertBooking(b: ConcertBooking): void {
  saveConcertBookings([b, ...loadConcertBookings()]);
}
