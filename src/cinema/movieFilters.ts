import type { Movie } from "./types";

export type ChartFilterTab = "all" | "now" | "soon" | "ended";

export function filterMoviesForChart(
  movies: Movie[],
  tab: ChartFilterTab,
  year: "all" | string
): Movie[] {
  return movies.filter((m) => {
    if (tab === "now" && m.releaseStatus !== "now") return false;
    if (tab === "soon" && m.releaseStatus !== "soon") return false;
    if (tab === "ended" && m.releaseStatus !== "ended") return false;
    if (year !== "all" && !m.openDate.startsWith(year)) return false;
    return true;
  });
}

export function formatStars(value: number): string {
  const n = Math.min(5, Math.max(0, Math.round(value)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}
