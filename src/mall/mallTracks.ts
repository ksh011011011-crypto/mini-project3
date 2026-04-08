/**
 * Mixkit 무료 음원(mixkit.co/license). 풀 트랙 URL + 이별·잔잔한 감성 풀.
 * 네트워크 이슈 시 MallAmbient에서 Web Audio 생성음으로 폴백합니다.
 */
export type MallTrack = { id: string; title: string; url: string };

export { EMOTIONAL_FAREWELL_TRACKS as MALL_AMBIENT_TRACKS } from "../audio/emotionalAmbientTracks";
export { pickRandomEmotionalTrack as pickRandomTrack } from "../audio/emotionalAmbientTracks";
