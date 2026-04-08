/**
 * Mixkit Stock Music Free License — https://mixkit.co/license/#musicFree
 * 슬로우·피아노·서정적 분위기 위주(이별·잔잔한 감성).
 * 특정 상업곡(예: "By Your Side")은 저작권상 레포에 포함할 수 없어, 유사 무드의 무료 라이선스 트랙을 사용합니다.
 *
 * 재생 URL은 예전 preview 경로 대신 풀 트랙 경로(브라우저에서 안정적으로 200 응답).
 */
export type AmbientTrack = { id: string; title: string; url: string };

export const EMOTIONAL_FAREWELL_TRACKS: AmbientTrack[] = [
  { id: "e614", title: "Silent Descent", url: "https://assets.mixkit.co/music/614/614.mp3" },
  { id: "e580", title: "Sun and His Daughter", url: "https://assets.mixkit.co/music/580/580.mp3" },
  { id: "e601", title: "Skyline", url: "https://assets.mixkit.co/music/601/601.mp3" },
  { id: "e52", title: "The Long Road", url: "https://assets.mixkit.co/music/52/52.mp3" },
  { id: "e22", title: "Piano Reflections", url: "https://assets.mixkit.co/music/22/22.mp3" },
  { id: "e714", title: "Classical 7", url: "https://assets.mixkit.co/music/714/714.mp3" },
  { id: "e71", title: "Slow Trail", url: "https://assets.mixkit.co/music/71/71.mp3" },
  { id: "e576", title: "Condor", url: "https://assets.mixkit.co/music/576/576.mp3" },
];

export function pickRandomEmotionalTrack(): AmbientTrack {
  const i = Math.floor(Math.random() * EMOTIONAL_FAREWELL_TRACKS.length);
  return EMOTIONAL_FAREWELL_TRACKS[i] ?? EMOTIONAL_FAREWELL_TRACKS[0];
}
