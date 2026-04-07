/**
 * Mixkit 무료 음원 프리뷰(상업적 이용 가능 라이선스 — mixkit.co/license).
 * 네트워크/CORS 이슈 시 MallAmbient에서 Web Audio 생성음으로 폴백합니다.
 */
export type MallTrack = { id: string; title: string; url: string };

export const MALL_AMBIENT_TRACKS: MallTrack[] = [
  {
    id: "m1",
    title: "Soft Lounge",
    url: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
  },
  {
    id: "m2",
    title: "Deep Focus",
    url: "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3",
  },
  {
    id: "m3",
    title: "Serene View",
    url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
  },
  {
    id: "m4",
    title: "Happy Walk",
    url: "https://assets.mixkit.co/music/preview/mixkit-happy-walk-1232.mp3",
  },
  {
    id: "m5",
    title: "Island Beat",
    url: "https://assets.mixkit.co/music/preview/mixkit-island-beat-250.mp3",
  },
];

export function pickRandomTrack(): MallTrack {
  const i = Math.floor(Math.random() * MALL_AMBIENT_TRACKS.length);
  return MALL_AMBIENT_TRACKS[i] ?? MALL_AMBIENT_TRACKS[0];
}
