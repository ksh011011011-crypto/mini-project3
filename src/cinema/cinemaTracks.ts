/**
 * Mixkit 무료 프리뷰( mixkit.co/license ). 시네마용 어두운·영화관 분위기 위주.
 */
export type CinemaTrack = { id: string; title: string; url: string };

export const CINEMA_AMBIENT_TRACKS: CinemaTrack[] = [
  {
    id: "c1",
    title: "Tech House Vibes",
    url: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
  },
  {
    id: "c2",
    title: "Driving Ambition",
    url: "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3",
  },
  {
    id: "c3",
    title: "Serene View",
    url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
  },
  {
    id: "c4",
    title: "Island Beat",
    url: "https://assets.mixkit.co/music/preview/mixkit-island-beat-250.mp3",
  },
];

export function pickRandomCinemaTrack(): CinemaTrack {
  const i = Math.floor(Math.random() * CINEMA_AMBIENT_TRACKS.length);
  return CINEMA_AMBIENT_TRACKS[i] ?? CINEMA_AMBIENT_TRACKS[0];
}
