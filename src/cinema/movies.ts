import type { Movie } from "./types";

/**
 * 데모용 실제 극장 포스터 이미지(TMDB CDN).
 * 파일명은 themoviedb.org 영화 페이지의 schema.org 이미지(w500)와 일치시킴(404 방지).
 * 비상업 데모·학습용. 저작권은 원 배급·TMDB 정책을 따릅니다.
 * @see https://www.themoviedb.org/
 */
const poster = (path: string) =>
  `https://image.tmdb.org/t/p/w500${path.startsWith("/") ? path : `/${path}`}`;
/** 포스터와 동일 파일을 와이드 배너용으로 확대(히어로용) */
const backdrop = (path: string) =>
  `https://image.tmdb.org/t/p/w1280${path.startsWith("/") ? path : `/${path}`}`;

export const MOVIES: Movie[] = [
  {
    id: "mv1",
    titleKo: "세현의 밤",
    titleEn: "Sehyeon Night",
    grade: "15",
    genre: "드라마",
    runtimeMin: 118,
    openDate: "2026-03-12",
    posterUrl: poster("rGyDyUyepFIdFQLnzBelp3vsSaB.jpg"),
    backdropUrl: backdrop("rGyDyUyepFIdFQLnzBelp3vsSaB.jpg"),
    synopsis:
      "복합몰 12층에서 시작된 우연한 만남이 밤새 이어지며, 각자의 선택을 마주한다.",
    eggPercent: 92,
    starRating: 4.5,
    releaseStatus: "now",
  },
  {
    id: "mv2",
    titleKo: "스크린X: 오디세이",
    titleEn: "ScreenX Odyssey",
    grade: "12",
    genre: "SF 어드벤처",
    runtimeMin: 132,
    openDate: "2026-02-28",
    posterUrl: poster("7zV8FTYofAORGm0Umgh1mNNCym8.jpg"),
    backdropUrl: backdrop("7zV8FTYofAORGm0Umgh1mNNCym8.jpg"),
    synopsis:
      "우주 정거장을 배경으로 한 압도적 스케일. 스크린X 전용 시퀀스 다수 수록.",
    eggPercent: 88,
    starRating: 4.2,
    releaseStatus: "now",
  },
  {
    id: "mv3",
    titleKo: "귀곡산",
    titleEn: "Whisper Ridge",
    grade: "19",
    genre: "스릴러",
    runtimeMin: 105,
    openDate: "2026-04-01",
    posterUrl: poster("iLU2meXFN8BxNcM0Lq2gPtpoO8L.jpg"),
    backdropUrl: backdrop("iLU2meXFN8BxNcM0Lq2gPtpoO8L.jpg"),
    synopsis:
      "안개 낀 산길에서 사라진 여행객. 남겨진 블랙박스가 말을 시작한다.",
    eggPercent: 95,
    starRating: 4.7,
    releaseStatus: "now",
  },
  {
    id: "mv4",
    titleKo: "패밀리 세일",
    titleEn: "Family Sale",
    grade: "전체",
    genre: "코미디",
    runtimeMin: 99,
    openDate: "2026-03-20",
    posterUrl: poster("ek8e8txUyUwd2BNqj6lFEerJfbq.jpg"),
    backdropUrl: backdrop("ek8e8txUyUwd2BNqj6lFEerJfbq.jpg"),
    synopsis:
      "대형 할인 행사 날, 한 가족만이 몰 전체를 뒤집어 놓는 하루.",
    eggPercent: 84,
    starRating: 3.9,
    releaseStatus: "now",
  },
  {
    id: "mv5",
    titleKo: "너의 이름은, 티켓",
    titleEn: "Your Name Is Ticket",
    grade: "12",
    genre: "로맨스",
    runtimeMin: 112,
    openDate: "2026-01-15",
    posterUrl: poster("ad9ndytwOckyShSc0A6tx1rZRkW.jpg"),
    backdropUrl: backdrop("ad9ndytwOckyShSc0A6tx1rZRkW.jpg"),
    synopsis:
      "잃어버린 예매번호를 찾기 위한 두 사람의 달리기. (가상의 리메이크)",
    eggPercent: 91,
    starRating: 4.4,
    releaseStatus: "now",
  },
  {
    id: "mv6",
    titleKo: "다큐: 라스트 몰",
    titleEn: "Doc: Last Mall",
    grade: "전체",
    genre: "다큐멘터리",
    runtimeMin: 96,
    openDate: "2026-04-06",
    posterUrl: poster("uxB5mNwYoD0oQPebZrTglsoNs0O.jpg"),
    backdropUrl: backdrop("uxB5mNwYoD0oQPebZrTglsoNs0O.jpg"),
    synopsis:
      "도심 속 몰의 밤과 아침을 기록한 관찰 다큐멘터리.",
    eggPercent: 79,
    starRating: 4.0,
    releaseStatus: "now",
  },
  {
    id: "mv7",
    titleKo: "미드나이트 아케이드",
    titleEn: "Midnight Arcade",
    grade: "12",
    genre: "액션",
    runtimeMin: 121,
    openDate: "2026-04-24",
    posterUrl: poster("8dGCWRwrMjn1jdFCI5xu5VrkGBL.jpg"),
    backdropUrl: backdrop("8dGCWRwrMjn1jdFCI5xu5VrkGBL.jpg"),
    synopsis:
      "폐쇄된 지하 아케이드에서 깨어난 봄버맨 군단. 네온과 픽셀의 야간전.",
    eggPercent: 0,
    starRating: 0,
    releaseStatus: "soon",
  },
  {
    id: "mv8",
    titleKo: "한강의 노래",
    titleEn: "River Anthem",
    grade: "전체",
    genre: "뮤지컬 영화",
    runtimeMin: 128,
    openDate: "2026-05-09",
    posterUrl: poster("ruZrJe35GG90394nbabbk9Ed7sS.jpg"),
    backdropUrl: backdrop("ruZrJe35GG90394nbabbk9Ed7sS.jpg"),
    synopsis:
      "밤새 이어지는 버스킹이 한강 전체를 무대로 바꾼다. 라이브 촬영 장면 다수.",
    eggPercent: 0,
    starRating: 0,
    releaseStatus: "soon",
  },
  {
    id: "mv9",
    titleKo: "블랙박스: 최후의 파일",
    titleEn: "Blackbox: Final File",
    grade: "15",
    genre: "미스터리",
    runtimeMin: 114,
    openDate: "2026-06-18",
    posterUrl: poster("qRCWmdRyeH3EGJZpZ18my21y1q8.jpg"),
    backdropUrl: backdrop("qRCWmdRyeH3EGJZpZ18my21y1q8.jpg"),
    synopsis:
      "삭제된 내비게이션 로그가 가리키는 마지막 목적지. 추적은 이제 시작이다.",
    eggPercent: 0,
    starRating: 0,
    releaseStatus: "soon",
  },
  {
    id: "mv10",
    titleKo: "가을, 서울역",
    titleEn: "Fall, Seoul Station",
    grade: "12",
    genre: "멜로",
    runtimeMin: 108,
    openDate: "2025-10-02",
    posterUrl: poster("6o6jgwvPc0W1FuFwA9XFAHwljt4.jpg"),
    backdropUrl: backdrop("6o6jgwvPc0W1FuFwA9XFAHwljt4.jpg"),
    synopsis:
      "지난 시즌 화제작. 스트리밍 동시 공개로 극장 상영은 종료되었습니다.",
    eggPercent: 87,
    starRating: 4.1,
    releaseStatus: "ended",
  },
];
