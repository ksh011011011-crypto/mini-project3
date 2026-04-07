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
    titleKo: "로스트 인 트랜슬레이션",
    titleEn: "Lost in Translation",
    grade: "12",
    genre: "드라마",
    runtimeMin: 102,
    openDate: "2003-10-03",
    posterUrl: poster("rGyDyUyepFIdFQLnzBelp3vsSaB.jpg"),
    backdropUrl: backdrop("rGyDyUyepFIdFQLnzBelp3vsSaB.jpg"),
    synopsis:
      "낯선 도쿄에서 만난 두 사람이 짧은 시간 안에 이해와 위로를 나누는 이야기.",
    eggPercent: 92,
    starRating: 4.5,
    releaseStatus: "now",
  },
  {
    id: "mv2",
    titleKo: "듄",
    titleEn: "Dune",
    grade: "12",
    genre: "SF",
    runtimeMin: 155,
    openDate: "2021-10-22",
    posterUrl: poster("7zV8FTYofAORGm0Umgh1mNNCym8.jpg"),
    backdropUrl: backdrop("7zV8FTYofAORGm0Umgh1mNNCym8.jpg"),
    synopsis:
      "사막 행성 아라키스를 둘러싼 가문의 운명과 스파이스 전쟁을 그린 SF 서사시.",
    eggPercent: 88,
    starRating: 4.2,
    releaseStatus: "now",
  },
  {
    id: "mv3",
    titleKo: "레버넌트",
    titleEn: "The Revenant",
    grade: "15",
    genre: "어드벤처",
    runtimeMin: 156,
    openDate: "2015-12-16",
    posterUrl: poster("iLU2meXFN8BxNcM0Lq2gPtpoO8L.jpg"),
    backdropUrl: backdrop("iLU2meXFN8BxNcM0Lq2gPtpoO8L.jpg"),
    synopsis:
      "야생에서 버려진 사냥꾼의 생존과 복수를 그린 처절한 자연 서사극.",
    eggPercent: 95,
    starRating: 4.7,
    releaseStatus: "now",
  },
  {
    id: "mv4",
    titleKo: "슈퍼배드",
    titleEn: "Superbad",
    grade: "15",
    genre: "코미디",
    runtimeMin: 113,
    openDate: "2007-08-17",
    posterUrl: poster("ek8e8txUyUwd2BNqj6lFEerJfbq.jpg"),
    backdropUrl: backdrop("ek8e8txUyUwd2BNqj6lFEerJfbq.jpg"),
    synopsis:
      "졸업 전 마지막 파티를 앞둔 고등학생 둘의 하룻밤 좌충우돌 성장 코미디.",
    eggPercent: 84,
    starRating: 3.9,
    releaseStatus: "now",
  },
  {
    id: "mv5",
    titleKo: "라 라 랜드",
    titleEn: "La La Land",
    grade: "12",
    genre: "뮤지컬",
    runtimeMin: 128,
    openDate: "2016-12-07",
    posterUrl: poster("ad9ndytwOckyShSc0A6tx1rZRkW.jpg"),
    backdropUrl: backdrop("ad9ndytwOckyShSc0A6tx1rZRkW.jpg"),
    synopsis:
      "꿈과 사랑 사이에서 선택을 마주하는 배우 지망생과 재즈 피아니스트의 러브 스토리.",
    eggPercent: 91,
    starRating: 4.4,
    releaseStatus: "now",
  },
  {
    id: "mv6",
    titleKo: "셰프",
    titleEn: "Chef",
    grade: "12",
    genre: "드라마",
    runtimeMin: 114,
    openDate: "2014-08-08",
    posterUrl: poster("uxB5mNwYoD0oQPebZrTglsoNs0O.jpg"),
    backdropUrl: backdrop("uxB5mNwYoD0oQPebZrTglsoNs0O.jpg"),
    synopsis:
      "식욕을 돋우는 푸드 트럭 여정과 아버지·아들의 관계를 그린 휴먼 푸드 무비.",
    eggPercent: 79,
    starRating: 4.0,
    releaseStatus: "now",
  },
  {
    id: "mv7",
    titleKo: "존 윅 3: 파라벨룸",
    titleEn: "John Wick: Chapter 3 - Parabellum",
    grade: "15",
    genre: "액션",
    runtimeMin: 131,
    openDate: "2019-05-22",
    posterUrl: poster("8dGCWRwrMjn1jdFCI5xu5VrkGBL.jpg"),
    backdropUrl: backdrop("8dGCWRwrMjn1jdFCI5xu5VrkGBL.jpg"),
    synopsis:
      "전 세계 킬러에게 쫓기며 뉴욕을 탈출하려는 전설의 킬러 존 윅의 연쇄 액션.",
    eggPercent: 0,
    starRating: 0,
    releaseStatus: "soon",
  },
  {
    id: "mv8",
    titleKo: "보헤미안 랩소디",
    titleEn: "Bohemian Rhapsody",
    grade: "12",
    genre: "뮤지컬",
    runtimeMin: 134,
    openDate: "2018-10-31",
    posterUrl: poster("ruZrJe35GG90394nbabbk9Ed7sS.jpg"),
    backdropUrl: backdrop("ruZrJe35GG90394nbabbk9Ed7sS.jpg"),
    synopsis:
      "퀸과 프레디 머큐리의 음악과 삶을 담은 라이브 무대가 압권인 뮤직 바이오픽.",
    eggPercent: 0,
    starRating: 0,
    releaseStatus: "soon",
  },
  {
    id: "mv9",
    titleKo: "나이브스 아웃",
    titleEn: "Knives Out",
    grade: "12",
    genre: "미스터리",
    runtimeMin: 130,
    openDate: "2019-11-27",
    posterUrl: poster("qRCWmdRyeH3EGJZpZ18my21y1q8.jpg"),
    backdropUrl: backdrop("qRCWmdRyeH3EGJZpZ18my21y1q8.jpg"),
    synopsis:
      "거대한 저택에서 벌어진 부자 소설가의 죽음을 둘러싼 추리와 풍자 코미디.",
    eggPercent: 0,
    starRating: 0,
    releaseStatus: "soon",
  },
  {
    id: "mv10",
    titleKo: "패스트 라이브스",
    titleEn: "Past Lives",
    grade: "12",
    genre: "멜로",
    runtimeMin: 105,
    openDate: "2023-06-02",
    posterUrl: poster("6o6jgwvPc0W1FuFwA9XFAHwljt4.jpg"),
    backdropUrl: backdrop("6o6jgwvPc0W1FuFwA9XFAHwljt4.jpg"),
    synopsis:
      "어린 시절 이별한 두 사람이 뉴욕에서 다시 만나 인연과 선택을 되짚는 조용한 멜로.",
    eggPercent: 87,
    starRating: 4.1,
    releaseStatus: "ended",
  },
];
