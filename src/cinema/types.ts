export type AgeGrade = "전체" | "12" | "15" | "19";

/** 상영 스케줄 생성 여부: 개봉예정작은 시간표 제외 */
export type MovieReleaseStatus = "now" | "soon" | "ended";

export type Movie = {
  id: string;
  titleKo: string;
  titleEn: string;
  grade: AgeGrade;
  genre: string;
  runtimeMin: number;
  /** YYYY-MM-DD */
  openDate: string;
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  /** 관객 추천 지수(데모 %) */
  eggPercent: number;
  /** 0~5 별점 (데모) */
  starRating: number;
  releaseStatus: MovieReleaseStatus;
};

export type Hall =
  | "1관 · 컴포트"
  | "2관 · 사운드MAX"
  | "3관 · 프리미엄"
  | "4관 · 스크린X"
  | "5관 · 돌비 애트모스"
  | "6관 · 골드클래스"
  | "7관 · 씨네&리빙룸"
  | "8관 · MX4D";

export type Screening = {
  id: string;
  movieId: string;
  startAt: string;
  hall: Hall;
  basePrice: number;
  /** 예매로 점유된 좌석 + 시드 랜덤 점유 */
  occupiedSeatIds: string[];
};

export type CinemaSnackLine = {
  id: string;
  name: string;
  qty: number;
  unitWon: number;
};

export type CinemaBooking = {
  id: string;
  screeningId: string;
  movieTitle: string;
  hall: Hall;
  startAt: string;
  seats: string[];
  totalWon: number;
  createdAt: number;
  /** 매점 스낵(팝콘 등) — 없으면 생략 */
  snacks?: CinemaSnackLine[];
};
