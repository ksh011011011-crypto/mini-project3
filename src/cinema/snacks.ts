export type SnackItem = {
  id: string;
  name: string;
  price: number;
  desc: string;
  imageUrl: string;
};

const u = (id: string) =>
  `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`;

/** 극장 매점(키오스크) 메뉴 — 데모 가격 */
export const SNACK_ITEMS: SnackItem[] = [
  {
    id: "pop-m",
    name: "팝콘 M",
    price: 5500,
    desc: "고소한 클래식",
    imageUrl: u("photo-1585647347488-5e62bb0c9c8b"),
  },
  {
    id: "pop-l",
    name: "팝콘 L",
    price: 6500,
    desc: "영화 한 편 끝까지",
    imageUrl: u("photo-1606760227091-3dd870d97f1d"),
  },
  {
    id: "combo1",
    name: "팝콘L + 탄산L 콤보",
    price: 9500,
    desc: "가성비 세트",
    imageUrl: u("photo-1626082927389-6cd097cdc6ec"),
  },
  {
    id: "combo2",
    name: "카라멜팝콘 + 아이스아메리카노",
    price: 11000,
    desc: "달콤·쌉싸름",
    imageUrl: u("photo-1509042239860-f550ce710b93"),
  },
  {
    id: "nacho",
    name: "나초 & 치즈",
    price: 7000,
    desc: "할라피뇨 토핑",
    imageUrl: u("photo-1513456852971-30c0b8199d4d"),
  },
  {
    id: "hotdog",
    name: "프리미엄 핫도그",
    price: 6000,
    desc: "감자빵 시그니처",
    imageUrl: u("photo-1528605248644-14dd04022da1"),
  },
];
