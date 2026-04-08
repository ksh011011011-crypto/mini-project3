/**
 * Mixkit 무료 음원(mixkit.co/license). 몰과 동일 이별·서정 톤.
 */
export type CinemaTrack = { id: string; title: string; url: string };

export { EMOTIONAL_FAREWELL_TRACKS as CINEMA_AMBIENT_TRACKS } from "../audio/emotionalAmbientTracks";
export { pickRandomEmotionalTrack as pickRandomCinemaTrack } from "../audio/emotionalAmbientTracks";
