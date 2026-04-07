import type { Hall } from "./types";

/** 상영관 라인업(스케줄 랜덤 배정에 사용) */
export const ALL_HALLS: Hall[] = [
  "1관 · 컴포트",
  "2관 · 사운드MAX",
  "3관 · 프리미엄",
  "4관 · 스크린X",
  "5관 · 돌비 애트모스",
  "6관 · 골드클래스",
  "7관 · 씨네&리빙룸",
  "8관 · MX4D",
];

/** 특별관·일반관 구분 없이 관람객 안내용 짧은 설명 */
export const HALL_DESCRIPTIONS: Record<Hall, string> = {
  "1관 · 컴포트":
    "넉넉한 좌석 간격과 기본 사운드. 가족·데일리 관람에 무난한 스탠다드관입니다.",
  "2관 · 사운드MAX":
    "저음역 보강과 명료한 대사 재현에 초점을 둔 사운드 튜닝관입니다.",
  "3관 · 프리미엄":
    "전동 리클라이너·담요 제공(데모 설정). 장편·힐링 관람에 적합합니다.",
  "4관 · 스크린X":
    "본관+좌우 벽면까지 이어지는 270° 패널로 액션·스펙터클 장면이 강조됩니다.",
  "5관 · 돌비 애트모스":
    "천장·벽면 스피커 매트릭스로 사운드 오브젝트가 공간감 있게 이동합니다.",
  "6관 · 골드클래스":
    "소인원 프리미엄 좌석·와이드 시트(데모). 커플·소규모 관람에 어울립니다.",
  "7관 · 씨네&리빙룸":
    "소파형 좌석과 테이블(데모)으로 여유 있는 관람 분위기를 연출합니다.",
  "8관 · MX4D":
    "움직이는 좌석·바람·향 등 효과(데모)가 더해진 체감형 상영관입니다. 효과 강도는 작품별로 다를 수 있습니다.",
};

export function basePriceForHall(hall: Hall): number {
  if (hall.includes("MX4D")) return 18000;
  if (hall.includes("스크린X")) return 16800;
  if (hall.includes("골드") || hall.includes("돌비")) return 17200;
  if (hall.includes("씨네&리빙") || hall.includes("리빙룸")) return 15600;
  if (hall.includes("프리미엄")) return 15000;
  if (hall.includes("사운드MAX")) return 14200;
  return 13200;
}
