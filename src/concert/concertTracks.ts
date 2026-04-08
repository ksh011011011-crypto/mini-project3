/**
 * Mixkit 무료 음원(mixkit.co/license) — 잔잔한 공연·감성 톤(몰·시네마와 동일 풀).
 */
export type ConcertTrack = { id: string; title: string; url: string };

export { EMOTIONAL_FAREWELL_TRACKS as CONCERT_AMBIENT_TRACKS } from "../audio/emotionalAmbientTracks";
export { pickRandomEmotionalTrack as pickRandomConcertTrack } from "../audio/emotionalAmbientTracks";
