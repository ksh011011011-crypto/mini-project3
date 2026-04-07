/**
 * Mixkit 프리뷰( mixkit.co/license ) — 콘서트·라이브 분위기용.
 */
export type ConcertTrack = { id: string; title: string; url: string };

export const CONCERT_AMBIENT_TRACKS: ConcertTrack[] = [
  {
    id: "cf1",
    title: "Happy Walk",
    url: "https://assets.mixkit.co/music/preview/mixkit-happy-walk-1232.mp3",
  },
  {
    id: "cf2",
    title: "Island Beat",
    url: "https://assets.mixkit.co/music/preview/mixkit-island-beat-250.mp3",
  },
  {
    id: "cf3",
    title: "Serene View",
    url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
  },
  {
    id: "cf4",
    title: "Driving Ambition",
    url: "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3",
  },
];

export function pickRandomConcertTrack(): ConcertTrack {
  const i = Math.floor(Math.random() * CONCERT_AMBIENT_TRACKS.length);
  return CONCERT_AMBIENT_TRACKS[i] ?? CONCERT_AMBIENT_TRACKS[0];
}
