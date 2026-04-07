import type { CinemaBooking } from "./types";

const KEY = "sehyeon-cinema-bookings";

export function loadBookings(): CinemaBooking[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as CinemaBooking[];
    if (!Array.isArray(p)) return [];
    return p.filter(
      (b) =>
        b &&
        typeof b.id === "string" &&
        typeof b.screeningId === "string" &&
        Array.isArray(b.seats)
    );
  } catch {
    return [];
  }
}

export function saveBookings(list: CinemaBooking[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addBooking(b: CinemaBooking): void {
  const prev = loadBookings();
  saveBookings([b, ...prev]);
}
