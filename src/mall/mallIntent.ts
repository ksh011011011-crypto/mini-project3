import type { ProductFloor } from "../data/products";

/** 상단 단지 메뉴 등에서 몰 층·카테고리·스크롤 동기화용 */
export type MallIntentPayload = {
  floorTab?: "전체" | ProductFloor;
  category?: string;
  scrollTo?: "best" | "event" | "cart" | "products" | "zoom";
  /** floorTab이 "전체"일 때 #floor-{n}으로 스크롤 */
  scrollToFloor?: ProductFloor;
};
