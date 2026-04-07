export type ConcertShow = {
  id: string;
  titleKo: string;
  titleEn: string;
  venue: string;
  hall: string;
  startAt: string;
  basePrice: number;
  occupiedSeatIds: string[];
  /** 데모용 관객 만족 지수 (5점 만점) */
  fanScore: number;
};

export type ConcertBooking = {
  id: string;
  showId: string;
  titleKo: string;
  venueLine: string;
  startAt: string;
  seats: string[];
  merch: { name: string; qty: number; unitWon: number }[];
  totalWon: number;
  createdAt: number;
};
