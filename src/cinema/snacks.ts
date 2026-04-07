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
    imageUrl: u("photo-1599599810769-bcde5a160d32"),
  },
  {
    id: "pop-l",
    name: "팝콘 L",
    price: 6500,
    desc: "큰 통에 담긴 버터향",
    imageUrl: u("photo-1606760227091-3dd870d97f1d"),
  },
  {
    id: "combo1",
    name: "패스트 콤보(버거·사이드·음료)",
    price: 9500,
    desc: "한 트레이에 담긴 세트 메뉴 느낌",
    imageUrl: u("photo-1615937657715-bc7b4b7962c1"),
  },
  {
    id: "combo2",
    name: "아이스 커피 (L)",
    price: 11000,
    desc: "시원한 글라스 아이스 커피",
    imageUrl: u("photo-1511920170033-f8396924c348"),
  },
  {
    id: "nacho",
    name: "나초 & 치즈",
    price: 7000,
    desc: "녹인 치즈 듬뿍",
    imageUrl: u("photo-1562967914-608f82629710"),
  },
  {
    id: "hotdog",
    name: "프리미엄 핫도그",
    price: 6000,
    desc: "토핑 올린 시그니처",
    imageUrl: u("photo-1528605248644-14dd04022da1"),
  },
];
