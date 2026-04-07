import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "../auth/AuthContext";
import FakeCheckoutModal, {
  type CheckoutLine,
} from "../payment/FakeCheckoutModal";
import { formatKrw } from "../lib/format";
import { addBooking, loadBookings, saveBookings } from "./bookingStorage";
import { formatStars, filterMoviesForChart } from "./movieFilters";
import { MOVIES } from "./movies";
import { SNACK_ITEMS } from "./snacks";
import { ALL_HALLS, HALL_DESCRIPTIONS } from "./hallInfo";
import {
  ALL_SEAT_IDS,
  buildSchedule,
  movieById,
  screeningsForMovieDay,
} from "./screenings";
import type { CinemaBooking, CinemaSnackLine, Hall, Screening } from "./types";
import CinemaAmbientDock from "./CinemaAmbientDock";

function mergedOccupied(s: Screening, bookings: CinemaBooking[]): Set<string> {
  const set = new Set(s.occupiedSeatIds);
  for (const b of bookings) {
    if (b.screeningId === s.id) b.seats.forEach((x) => set.add(x));
  }
  return set;
}

function remainingSeats(s: Screening, bookings: CinemaBooking[]): number {
  return ALL_SEAT_IDS.length - mergedOccupied(s, bookings).size;
}

function seatExtraWon(seatId: string): number {
  if (/^[DEF][4-9]$/.test(seatId)) return 2500;
  if (/^[GH][3-9]$/.test(seatId)) return 1000;
  return 0;
}

function priceForSeat(s: Screening, seatId: string): number {
  return s.basePrice + seatExtraWon(seatId);
}

function formatShowTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function dayLabel(dayIndex: number, now: Date): string {
  if (dayIndex === 0) return "오늘";
  if (dayIndex === 1) return "내일";
  const x = new Date(now);
  x.setDate(x.getDate() + dayIndex);
  return `${x.getMonth() + 1}/${x.getDate()}`;
}

function weekLabel(dayIndex: number, now: Date): string {
  const x = new Date(now);
  x.setDate(x.getDate() + dayIndex);
  const w = ["일", "월", "화", "수", "목", "금", "토"][x.getDay()];
  return w;
}

const rows = "ABCDEFGH".split("");

export type CinemaShellView = "chart" | "timetable" | "my" | "store";

export type CinemaFocusRequest = { view: CinemaShellView; token: number };

export default function CinemaSite({
  kiosk = false,
  focus,
  fxPulse = 0,
}: {
  kiosk?: boolean;
  focus?: CinemaFocusRequest;
  /** 상단 탭·빠른 이동으로 시네마 진입할 때마다 증가 → 별 연출 */
  fxPulse?: number;
}) {
  const { loginGuest } = useAuth();
  const now = useMemo(() => new Date(), []);
  const schedule = useMemo(() => buildSchedule(now), [now]);
  const firstNowId =
    MOVIES.find((m) => m.releaseStatus === "now")?.id ?? MOVIES[0].id;
  const [movieId, setMovieId] = useState(firstNowId);
  const [timetableMovieId, setTimetableMovieId] = useState(firstNowId);
  const [dayIndex, setDayIndex] = useState(0);
  const [bookings, setBookings] = useState<CinemaBooking[]>(() => loadBookings());
  const [picker, setPicker] = useState<Screening | null>(null);
  const [pickSeats, setPickSeats] = useState<string[]>([]);
  const [flowStep, setFlowStep] = useState<"seats" | "snacks">("seats");
  const [snackQty, setSnackQty] = useState<Record<string, number>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [view, setView] = useState<"chart" | "timetable" | "my" | "store">(
    "chart"
  );
  const [chartTab, setChartTab] = useState<
    "all" | "now" | "soon" | "ended"
  >("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [starBloom, setStarBloom] = useState(false);

  useEffect(() => {
    if (kiosk) return;
    if (fxPulse < 1) return;
    setStarBloom(true);
    const t = window.setTimeout(() => setStarBloom(false), 1500);
    return () => window.clearTimeout(t);
  }, [fxPulse, kiosk]);

  useEffect(() => {
    if (kiosk) loginGuest();
  }, [kiosk, loginGuest]);

  useEffect(() => {
    if (kiosk || !focus) return;
    setView(focus.view);
    const anchor =
      focus.view === "chart"
        ? "chart-h"
        : focus.view === "timetable"
          ? "cinema-schedule"
          : focus.view === "store"
            ? "store-h"
            : "my-h";
    const id = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
    }, 90);
    return () => window.clearTimeout(id);
  }, [focus?.token, kiosk, focus]);

  useEffect(() => {
    if (view !== "timetable") return;
    const cur = movieById(movieId);
    if (cur.releaseStatus !== "now") {
      setMovieId(firstNowId);
    }
  }, [view, movieId, firstNowId]);

  useEffect(() => {
    const cur = movieById(movieId);
    if (cur.releaseStatus === "now") setTimetableMovieId(movieId);
  }, [movieId]);

  useEffect(() => {
    if (view !== "timetable") return;
    setTimetableMovieId((id) => {
      const m = movieById(id);
      return m.releaseStatus === "now" ? id : firstNowId;
    });
  }, [view, firstNowId]);

  const chartMovies = useMemo(
    () => filterMoviesForChart(MOVIES, chartTab, yearFilter),
    [chartTab, yearFilter]
  );

  const chartYearOptions = useMemo(() => {
    const y = new Set<string>();
    for (const m of MOVIES) y.add(m.openDate.slice(0, 4));
    return [...y].sort((a, b) => b.localeCompare(a));
  }, []);

  const nowMovies = useMemo(
    () => MOVIES.filter((m) => m.releaseStatus === "now"),
    []
  );

  const movie = movieById(movieId);
  const timetableMovie = movieById(timetableMovieId);
  const dayScreenings = useMemo(
    () =>
      screeningsForMovieDay(schedule, timetableMovieId, dayIndex, now),
    [schedule, timetableMovieId, dayIndex, now]
  );

  const byHall = useMemo(() => {
    const m = new Map<Hall, Screening[]>();
    for (const s of dayScreenings) {
      const arr = m.get(s.hall) ?? [];
      arr.push(s);
      m.set(s.hall, arr);
    }
    for (const [, arr] of m) {
      arr.sort((a, b) => a.startAt.localeCompare(b.startAt));
    }
    return m;
  }, [dayScreenings]);

  const refreshBookings = useCallback(() => {
    setBookings(loadBookings());
  }, []);

  const closePicker = useCallback(() => {
    setPicker(null);
    setPickSeats([]);
    setFlowStep("seats");
    setSnackQty({});
    setPayOpen(false);
  }, []);

  const openPicker = (s: Screening) => {
    setPicker(s);
    setPickSeats([]);
    setFlowStep("seats");
    setSnackQty({});
    setPayOpen(false);
  };

  const toggleSeat = (id: string) => {
    if (!picker) return;
    const occ = mergedOccupied(picker, bookings);
    if (occ.has(id)) return;
    setPickSeats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const snackLinesDetail = useCallback((): CinemaSnackLine[] => {
    return SNACK_ITEMS.filter((s) => (snackQty[s.id] ?? 0) > 0).map((s) => ({
      id: s.id,
      name: s.name,
      qty: snackQty[s.id] ?? 0,
      unitWon: s.price,
    }));
  }, [snackQty]);

  const buildCheckoutLines = useCallback((): CheckoutLine[] => {
    if (!picker) return [];
    const ticket = pickSeats.reduce(
      (sum, sid) => sum + priceForSeat(picker, sid),
      0
    );
    const lines: CheckoutLine[] = [
      {
        label: "영화 티켓",
        detail: `${movieById(picker.movieId).titleKo} · 좌석 ${[...pickSeats].sort().join(", ")}`,
        won: ticket,
      },
    ];
    for (const s of SNACK_ITEMS) {
      const q = snackQty[s.id] ?? 0;
      if (q > 0) lines.push({ label: s.name, detail: `×${q}`, won: q * s.price });
    }
    return lines;
  }, [picker, pickSeats, snackQty]);

  const handlePaid = useCallback(() => {
    if (!picker || pickSeats.length === 0) return;
    const occ = mergedOccupied(picker, bookings);
    for (const s of pickSeats) {
      if (occ.has(s)) return;
    }
    const ticket = pickSeats.reduce(
      (sum, sid) => sum + priceForSeat(picker, sid),
      0
    );
    const snacks = snackLinesDetail();
    const snackSum = snacks.reduce((s, x) => s + x.qty * x.unitWon, 0);
    const b: CinemaBooking = {
      id: `bk-${Date.now()}`,
      screeningId: picker.id,
      movieTitle: movieById(picker.movieId).titleKo,
      hall: picker.hall,
      startAt: picker.startAt,
      seats: [...pickSeats].sort(),
      totalWon: ticket + snackSum,
      createdAt: Date.now(),
      snacks: snacks.length ? snacks : undefined,
    };
    addBooking(b);
    refreshBookings();
    closePicker();
  }, [
    picker,
    pickSeats,
    bookings,
    snackLinesDetail,
    refreshBookings,
    closePicker,
  ]);

  const clearAllBookings = () => {
    saveBookings([]);
    refreshBookings();
  };

  const occPicker = picker ? mergedOccupied(picker, bookings) : new Set<string>();
  const pickTotal =
    picker && pickSeats.length
      ? pickSeats.reduce((sum, sid) => sum + priceForSeat(picker, sid), 0)
      : 0;

  return (
    <div style={cx.page} className="cinema-site-root">
      <header style={cx.topbar}>
        <div style={cx.topInner}>
          <div style={cx.brandBlock}>
            <span style={cx.brandKo}>세현 시네마</span>
            <span style={cx.brandEn}>SEHYEON CINEMA · 10F</span>
          </div>
          <nav style={cx.nav} aria-label="시네마 메뉴">
            {(
              [
                ["chart", "무비차트"],
                ["timetable", "상영시간표"],
                ["store", "매점"],
                ["my", "예매내역"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                style={{ ...cx.navBtn, ...(view === k ? cx.navBtnOn : {}) }}
                onClick={() => setView(k)}
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            style={cx.quickBtn}
            onClick={() => {
              setView("timetable");
              window.setTimeout(() => {
                document
                  .getElementById("cinema-schedule")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 80);
            }}
          >
            빠른예매
          </button>
        </div>
      </header>

      <section
        style={cx.hero}
        className={`cinema-hero-wrap${starBloom ? " cinema-hero-bloom" : ""}`}
        aria-label="대표 배너"
      >
        <img src={movie.backdropUrl} alt="" style={cx.heroBg} />
        <div style={cx.heroGrad} />
        <div className="cinema-hero-stars" aria-hidden />
        <div className="cinema-hero-stars-2" aria-hidden />
        <div style={cx.heroContent}>
          <p style={cx.heroBadge}>지금 예매 중 · 실시간 잔여석 반영(데모)</p>
          <h1 style={cx.heroTitle}>{movie.titleKo}</h1>
          <p style={cx.heroSub}>
            {movie.titleEn} · {movie.genre} · {movie.runtimeMin}분 · 관람등급{" "}
            {movie.grade === "전체" ? "전체관람가" : `${movie.grade}세 이상`}
          </p>
          <div style={cx.heroRow}>
            {movie.starRating > 0 ? (
              <span style={cx.starLine}>
                <span style={cx.starGold}>{formatStars(movie.starRating)}</span>
                <span style={cx.starNum}>{movie.starRating.toFixed(1)}</span>
                <span style={cx.starSep}>·</span>
                <span style={cx.egg}>관객추천 {movie.eggPercent}%</span>
              </span>
            ) : (
              <span style={cx.egg}>개봉 예정 · 관객평 선공개 전</span>
            )}
            <button
              type="button"
              style={cx.heroCta}
              onClick={() => {
                setView("timetable");
                document.getElementById("cinema-schedule")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              상영시간표 보기
            </button>
          </div>
        </div>
      </section>

      <main style={cx.main}>
        {view === "chart" && (
          <section style={cx.section} aria-labelledby="chart-h">
            <h2 id="chart-h" style={cx.h2}>
              무비차트
            </h2>
            <p style={cx.lead}>
              상영 중·개봉 예정·연도별로 골라 보세요. 포스터 비율 2:3 유지, 별점·추천
              지수는 데모 값입니다.
            </p>
            <div style={cx.filterBar}>
              {(
                [
                  ["all", "전체"],
                  ["now", "현재상영작"],
                  ["soon", "개봉예정작"],
                  ["ended", "상영종료"],
                ] as const
              ).map(([k, lab]) => (
                <button
                  key={k}
                  type="button"
                  style={{
                    ...cx.filterChip,
                    ...(chartTab === k ? cx.filterChipOn : {}),
                  }}
                  onClick={() => setChartTab(k)}
                >
                  {lab}
                </button>
              ))}
              <label style={cx.yearLbl}>
                개봉연도
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={cx.yearSel}
                >
                  <option value="all">전체</option>
                  {chartYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {chartMovies.length === 0 ? (
              <p style={cx.muted}>조건에 맞는 작품이 없습니다.</p>
            ) : (
              <div style={cx.movieGrid}>
                {chartMovies.map((m) => {
                  const badge =
                    m.releaseStatus === "soon"
                      ? { t: "개봉예정", s: cx.badgeSoon }
                      : m.releaseStatus === "ended"
                        ? { t: "상영종료", s: cx.badgeEnd }
                        : { t: "상영중", s: cx.badgeNow };
                  return (
                    <button
                      key={m.id}
                      type="button"
                      style={{
                        ...cx.posterCard,
                        ...(m.id === movieId ? cx.posterCardOn : {}),
                      }}
                      onClick={() => setMovieId(m.id)}
                    >
                      <div style={cx.posterWrap}>
                        <img src={m.posterUrl} alt="" style={cx.posterImg} />
                        <span style={cx.gradeBadge}>{m.grade}</span>
                        <span style={{ ...cx.statusBadge, ...badge.s }}>
                          {badge.t}
                        </span>
                      </div>
                      <p style={cx.posterTitle}>{m.titleKo}</p>
                      <p style={cx.posterStars}>
                        {m.starRating > 0 ? (
                          <>
                            <span style={cx.starGoldSm}>
                              {formatStars(m.starRating)}
                            </span>{" "}
                            {m.starRating.toFixed(1)}
                          </>
                        ) : (
                          <span style={cx.muted}>평점 · 개봉 후 공개</span>
                        )}
                      </p>
                      <p style={cx.posterMeta}>
                        {m.releaseStatus === "now"
                          ? `추천 ${m.eggPercent}%`
                          : m.releaseStatus === "soon"
                            ? "D-개봉"
                            : "VOD"}{" "}
                        · {m.openDate}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {view === "store" && (
          <section style={cx.section} aria-labelledby="store-h">
            <h2 id="store-h" style={cx.h2}>
              시네마 매점
            </h2>
            <p style={cx.lead}>
              메뉴는 예매 흐름 「매점 · 스낵 담기」에서도 동일하게 담을 수 있습니다.
            </p>
            <div style={cx.storeGrid}>
              {SNACK_ITEMS.map((s) => (
                <article key={s.id} style={cx.snackCard}>
                  <div style={cx.snackImgWrap}>
                    <img src={s.imageUrl} alt="" style={cx.snackImg} />
                  </div>
                  <h3 style={cx.snackTitle}>{s.name}</h3>
                  <p style={cx.snackDesc}>{s.desc}</p>
                  <p style={cx.snackPriceTag}>{formatKrw(s.price)}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {(view === "timetable" || view === "chart" || view === "store") && (
          <section
            id="cinema-schedule"
            style={cx.section}
            aria-labelledby="sch-h"
          >
            <h2 id="sch-h" style={cx.h2}>
              상영시간표 · 예매
            </h2>
            <p style={cx.lead}>
              날짜를 고른 뒤 회차를 누르면 좌석도가 열립니다. 주말·프라임은
              요금이 올라갑니다. 아래에서 특별관·일반관 설명을 펼쳐 보실 수
              있습니다.
            </p>

            <details style={cx.hallDetails}>
              <summary style={cx.hallSummary}>
                상영관·특별관 안내 (전체 {ALL_HALLS.length}관)
              </summary>
              <ul style={cx.hallGuideList}>
                {ALL_HALLS.map((h) => (
                  <li key={h} style={cx.hallGuideItem}>
                    <span style={cx.hallGuideName}>{h}</span>
                    <span style={cx.hallGuideText}>{HALL_DESCRIPTIONS[h]}</span>
                  </li>
                ))}
              </ul>
            </details>

            <div style={cx.moviePick}>
              <label style={cx.lbl}>영화 (상영 중인 작품만 예매 가능)</label>
              <select
                value={
                  nowMovies.some((m) => m.id === timetableMovieId)
                    ? timetableMovieId
                    : (nowMovies[0]?.id ?? timetableMovieId)
                }
                onChange={(e) => setTimetableMovieId(e.target.value)}
                style={cx.select}
              >
                {nowMovies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.titleKo}
                    {m.starRating > 0
                      ? ` · ${formatStars(m.starRating)} ${m.starRating.toFixed(1)}`
                      : ""}
                  </option>
                ))}
              </select>
              {nowMovies.length === 0 ? (
                <p style={cx.muted}>현재 상영 중인 작품이 없습니다.</p>
              ) : movieId !== timetableMovieId &&
                movie.releaseStatus !== "now" ? (
                <p style={cx.timetableHint}>
                  상단 히어로는 &ldquo;{movie.titleKo}&rdquo;입니다. 시간표·예매는
                  상영 중인 &ldquo;{timetableMovie.titleKo}&rdquo; 기준입니다.
                </p>
              ) : null}
            </div>

            <div style={cx.dayRow} role="tablist" aria-label="상영일">
              {Array.from({ length: 7 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={dayIndex === i}
                  style={{
                    ...cx.dayChip,
                    ...(dayIndex === i ? cx.dayChipOn : {}),
                  }}
                  onClick={() => setDayIndex(i)}
                >
                  <span style={cx.dayChipMain}>{dayLabel(i, now)}</span>
                  <span style={cx.dayChipSub}>{weekLabel(i, now)}</span>
                </button>
              ))}
            </div>

            <div style={cx.synopsisBox}>
              <h3 style={cx.h3}>{timetableMovie.titleKo}</h3>
              <p style={cx.synopsis}>{timetableMovie.synopsis}</p>
            </div>

            {dayScreenings.length === 0 ? (
              <p style={cx.muted}>선택한 날짜에 상영 회차가 없습니다.</p>
            ) : (
              <div style={cx.tableWrap}>
                <table style={cx.table}>
                  <thead>
                    <tr>
                      <th style={cx.th}>상영관</th>
                      <th style={cx.th}>회차 · 잔여석 · 예매</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...byHall.entries()].map(([hall, list]) => (
                      <tr key={hall}>
                        <td style={cx.tdHall}>{hall}</td>
                        <td style={cx.tdTimes}>
                          <div style={cx.timeGrid}>
                            {list.map((s) => {
                              const rem = remainingSeats(s, bookings);
                              const soldOut = rem <= 0;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  disabled={soldOut}
                                  style={{
                                    ...cx.timeBtn,
                                    ...(soldOut ? cx.timeBtnOff : {}),
                                  }}
                                  onClick={() => openPicker(s)}
                                >
                                  <span style={cx.timeMain}>
                                    {formatShowTime(s.startAt)}
                                  </span>
                                  <span style={cx.timeSub}>
                                    {soldOut
                                      ? "매진"
                                      : `잔여 ${rem}석 · ${formatKrw(s.basePrice)}~`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {view === "my" && (
          <section style={cx.section} aria-labelledby="my-h">
            <h2 id="my-h" style={cx.h2}>
              나의 예매내역
            </h2>
            <p style={cx.lead}>
              예매 확정은 <strong>관리자 로그인 후 가짜 결제</strong>를 통해서만
              저장됩니다. 스낵은 좌석 선택 후 매점 단계에서 담습니다.
            </p>
            {bookings.length === 0 ? (
              <p style={cx.muted}>예매 내역이 없습니다.</p>
            ) : (
              <>
                <ul style={cx.bookList}>
                  {bookings.map((b) => (
                    <li key={b.id} style={cx.bookRow}>
                      <div>
                        <p style={cx.bookTitle}>{b.movieTitle}</p>
                        <p style={cx.muted}>
                          {new Date(b.startAt).toLocaleString("ko-KR")} · {b.hall}
                        </p>
                        <p style={cx.muted}>좌석 {b.seats.join(", ")}</p>
                        {b.snacks && b.snacks.length > 0 ? (
                          <p style={cx.muted}>
                            매점:{" "}
                            {b.snacks
                              .map((s) => `${s.name}×${s.qty}`)
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <p style={cx.bookPrice}>{formatKrw(b.totalWon)}</p>
                    </li>
                  ))}
                </ul>
                <button type="button" style={cx.dangerBtn} onClick={clearAllBookings}>
                  예매 내역 전체 삭제 (데모)
                </button>
              </>
            )}
          </section>
        )}
      </main>

      {picker && (
        <div
          style={cx.modalRoot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="seat-title"
        >
          <button
            type="button"
            style={cx.modalBackdrop}
            aria-label="닫기"
            onClick={closePicker}
          />
          <div
            style={{
              ...cx.modalPanel,
              ...(kiosk ? { width: "min(100%, 640px)", padding: "24px 20px" } : {}),
            }}
          >
            <h3 id="seat-title" style={cx.modalTitle}>
              {flowStep === "seats" ? "좌석 선택" : "매점 · 스낵(키오스크)"}
            </h3>
            <p style={cx.muted}>
              {movieById(picker.movieId).titleKo} · {formatShowTime(picker.startAt)}{" "}
              · {picker.hall}
            </p>

            {flowStep === "seats" && (
              <>
                <div style={cx.screen}>SCREEN</div>
                <div style={cx.seatMap}>
                  {rows.map((r) => (
                    <div key={r} style={cx.seatRow}>
                      <span style={cx.rowLabel}>{r}</span>
                      {Array.from({ length: 12 }, (_, i) => {
                        const id = `${r}${i + 1}`;
                        const occ = occPicker.has(id);
                        const sel = pickSeats.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={occ}
                            title={
                              occ
                                ? "선택불가"
                                : `${id} · ${formatKrw(priceForSeat(picker, id))}`
                            }
                            style={{
                              ...cx.seat,
                              ...(kiosk
                                ? { minHeight: 36, maxWidth: 36, fontSize: "0.7rem" }
                                : {}),
                              ...(occ ? cx.seatOcc : {}),
                              ...(sel ? cx.seatSel : {}),
                            }}
                            onClick={() => toggleSeat(id)}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div style={cx.legend}>
                  <span style={cx.lg}>
                    <i style={{ ...cx.lgDot, background: "#3b82f6" }} /> 선택
                  </span>
                  <span style={cx.lg}>
                    <i style={{ ...cx.lgDot, background: "#2a2a34" }} /> 불가
                  </span>
                  <span style={cx.lg}>
                    <i style={{ ...cx.lgDot, background: "#1e293b" }} /> 일반
                  </span>
                </div>
                <p style={cx.totalLine}>
                  선택 {pickSeats.length}석 · <strong>{formatKrw(pickTotal)}</strong>
                </p>
                <div style={cx.modalActions}>
                  <button type="button" style={cx.ghostBtn} onClick={closePicker}>
                    취소
                  </button>
                  <button
                    type="button"
                    style={cx.primaryBtn}
                    disabled={pickSeats.length === 0}
                    onClick={() => setFlowStep("snacks")}
                  >
                    매점 · 스낵 담기
                  </button>
                </div>
              </>
            )}

            {flowStep === "snacks" && (
              <>
                <p style={cx.muted}>
                  팝콘·콤보 등을 고른 뒤 결제로 이동합니다. (관리자만 승인)
                </p>
                <div style={cx.snackList}>
                  {SNACK_ITEMS.map((s) => {
                    const q = snackQty[s.id] ?? 0;
                    return (
                      <div key={s.id} style={cx.snackRow}>
                        <div>
                          <div style={cx.snackName}>{s.name}</div>
                          <div style={cx.snackPrice}>{formatKrw(s.price)}</div>
                        </div>
                        <div style={cx.snackQty}>
                          <button
                            type="button"
                            style={cx.snackMini}
                            onClick={() =>
                              setSnackQty((prev) => ({
                                ...prev,
                                [s.id]: Math.max(0, (prev[s.id] ?? 0) - 1),
                              }))
                            }
                            aria-label="감소"
                          >
                            −
                          </button>
                          <span>{q}</span>
                          <button
                            type="button"
                            style={cx.snackMini}
                            onClick={() =>
                              setSnackQty((prev) => ({
                                ...prev,
                                [s.id]: (prev[s.id] ?? 0) + 1,
                              }))
                            }
                            aria-label="증가"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={cx.totalLine}>
                  티켓 {formatKrw(pickTotal)} + 매점{" "}
                  <strong>
                    {formatKrw(
                      SNACK_ITEMS.reduce(
                        (sum, s) => sum + (snackQty[s.id] ?? 0) * s.price,
                        0
                      )
                    )}
                  </strong>
                </p>
                <div style={cx.modalActions}>
                  <button
                    type="button"
                    style={cx.ghostBtn}
                    onClick={() => setFlowStep("seats")}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    style={cx.primaryBtn}
                    onClick={() => setPayOpen(true)}
                  >
                    결제하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <FakeCheckoutModal
        open={payOpen}
        title="세현 시네마 · 결제(데모)"
        lines={buildCheckoutLines()}
        onClose={() => setPayOpen(false)}
        onPaid={handlePaid}
        successTitle="예매 · 결제가 완료되었습니다"
        successSubtitle="전자티켓이 발급되었습니다. 예매내역 탭에서 확인할 수 있어요."
      />

      {!kiosk ? <CinemaAmbientDock /> : null}

      <footer style={cx.footer}>
        세현 시네마는 세현몰 10층에 위치한 가상 브랜드입니다. CGV·메가박스·롯데시네마
        등 실제 사이트의 시간표·가격 UI 패턴을 참고해 제작했습니다.
      </footer>
    </div>
  );
}

const cx: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#07070b",
    color: "#ececf1",
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    background: "rgba(7,7,11,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #1f1f2a",
  },
  topInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  brandBlock: { display: "flex", flexDirection: "column", gap: 2 },
  brandKo: { fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em" },
  brandEn: { fontSize: "0.65rem", color: "#9b9bad", letterSpacing: "0.12em" },
  nav: { display: "flex", gap: 6, flex: 1, justifyContent: "center" },
  navBtn: {
    border: "1px solid transparent",
    background: "transparent",
    color: "#b7b7c7",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  navBtnOn: {
    borderColor: "#f43f5e",
    color: "#fff",
    background: "rgba(244,63,94,0.12)",
  },
  quickBtn: {
    border: "1px solid #f43f5e",
    background: "linear-gradient(135deg,#fb7185,#f43f5e)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: "0.8rem",
  },
  hero: { position: "relative", minHeight: 300, overflow: "hidden" },
  heroBg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.45)",
  },
  heroGrad: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg,rgba(7,7,11,0.95) 0%,rgba(7,7,11,0.55) 45%,rgba(7,7,11,0.2) 100%)",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "36px 16px 48px",
  },
  heroBadge: {
    margin: "0 0 8px",
    fontSize: "0.75rem",
    color: "#fda4af",
    fontWeight: 600,
    letterSpacing: "0.06em",
  },
  heroTitle: {
    margin: "0 0 8px",
    fontSize: "clamp(1.6rem,4vw,2.4rem)",
    fontWeight: 800,
    lineHeight: 1.15,
  },
  heroSub: { margin: "0 0 16px", color: "#c4c4d4", fontSize: "0.9rem" },
  heroRow: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" },
  egg: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#fbbf24",
  },
  starLine: {
    display: "inline-flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  starGold: { color: "#fbbf24", letterSpacing: 1, fontSize: "0.8rem" },
  starGoldSm: { color: "#fbbf24", letterSpacing: 0.5, fontSize: "0.68rem" },
  starNum: { fontWeight: 800, fontSize: "0.85rem", color: "#fff" },
  starSep: { color: "#6b6b7a", fontSize: "0.85rem" },
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  filterChip: {
    border: "1px solid #2a2a36",
    background: "#0f0f16",
    color: "#b7b7c7",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  filterChipOn: {
    borderColor: "#f43f5e",
    color: "#fff",
    background: "rgba(244,63,94,0.15)",
  },
  yearLbl: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.75rem",
    color: "#8b8b9c",
    fontWeight: 600,
    marginLeft: "auto",
  },
  yearSel: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #2a2a36",
    background: "#101018",
    color: "#fff",
    fontSize: "0.78rem",
  },
  statusBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    fontSize: "0.62rem",
    fontWeight: 800,
    padding: "3px 6px",
    borderRadius: 4,
    color: "#fff",
  },
  badgeNow: { background: "rgba(34,197,94,0.85)" },
  badgeSoon: { background: "rgba(59,130,246,0.9)" },
  badgeEnd: { background: "rgba(100,116,139,0.9)" },
  posterStars: { margin: "0 0 4px", fontSize: "0.74rem", color: "#c4c4d4" },
  storeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
  },
  snackCard: {
    border: "1px solid #1f1f2a",
    borderRadius: 14,
    overflow: "hidden",
    background: "#0c0c12",
  },
  snackImgWrap: {
    aspectRatio: "16 / 10",
    background: "#1a1a24",
    overflow: "hidden",
  },
  snackImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  snackTitle: { margin: "10px 12px 4px", fontSize: "0.95rem", fontWeight: 800 },
  snackDesc: {
    margin: "0 12px 8px",
    fontSize: "0.78rem",
    color: "#8b8b9c",
    lineHeight: 1.45,
  },
  snackPriceTag: {
    margin: "0 12px 12px",
    fontWeight: 800,
    color: "#fbbf24",
    fontSize: "0.88rem",
  },
  heroCta: {
    border: "none",
    background: "#fff",
    color: "#111",
    padding: "10px 20px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.85rem",
  },
  main: {
    flex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "8px 16px 48px",
    width: "100%",
  },
  section: { marginBottom: 40 },
  h2: { fontSize: "1.2rem", margin: "0 0 8px", fontWeight: 800 },
  h3: { fontSize: "1rem", margin: "0 0 8px", fontWeight: 700 },
  lead: { margin: "0 0 16px", color: "#9b9bad", fontSize: "0.88rem", lineHeight: 1.55 },
  muted: { margin: 0, color: "#8b8b9c", fontSize: "0.85rem" },
  movieGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 14,
  },
  posterCard: {
    border: "1px solid #1f1f2a",
    background: "#101018",
    borderRadius: 12,
    padding: 8,
    textAlign: "left",
    color: "inherit",
    cursor: "pointer",
    transition: "border-color 0.15s, transform 0.15s",
  },
  posterCardOn: {
    borderColor: "#f43f5e",
    boxShadow: "0 0 0 1px rgba(244,63,94,0.35)",
    transform: "translateY(-2px)",
  },
  posterWrap: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    aspectRatio: "2 / 3",
    background: "#1a1a24",
  },
  posterImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  gradeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    background: "rgba(0,0,0,0.72)",
    color: "#fff",
    fontSize: "0.65rem",
    fontWeight: 800,
    padding: "3px 6px",
    borderRadius: 4,
  },
  posterTitle: {
    margin: "8px 0 4px",
    fontSize: "0.88rem",
    fontWeight: 700,
    lineHeight: 1.3,
  },
  posterMeta: { margin: 0, fontSize: "0.72rem", color: "#8b8b9c" },
  moviePick: { marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 },
  timetableHint: {
    margin: "8px 0 0",
    fontSize: "0.78rem",
    color: "#fda4af",
    lineHeight: 1.45,
  },
  lbl: { fontSize: "0.72rem", color: "#8b8b9c", fontWeight: 600 },
  select: {
    maxWidth: 420,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2a2a36",
    background: "#101018",
    color: "#fff",
    fontSize: "0.9rem",
  },
  dayRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
    marginBottom: 16,
    WebkitOverflowScrolling: "touch",
  },
  dayChip: {
    flex: "0 0 auto",
    minWidth: 72,
    border: "1px solid #2a2a36",
    background: "#0f0f16",
    color: "#b7b7c7",
    borderRadius: 10,
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  dayChipOn: {
    borderColor: "#f43f5e",
    color: "#fff",
    background: "rgba(244,63,94,0.12)",
  },
  dayChipMain: { fontWeight: 800, fontSize: "0.85rem" },
  dayChipSub: { fontSize: "0.7rem", color: "#8b8b9c" },
  synopsisBox: {
    border: "1px solid #1f1f2a",
    background: "#0c0c12",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 20,
  },
  synopsis: { margin: 0, fontSize: "0.88rem", color: "#b4b4c4", lineHeight: 1.6 },
  hallDetails: {
    marginBottom: 16,
    border: "1px solid #1f1f2a",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#0c0c12",
  },
  hallSummary: {
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.85rem",
    color: "#e4e4ec",
  },
  hallGuideList: {
    margin: "12px 0 0",
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  hallGuideItem: { display: "flex", flexDirection: "column", gap: 4 },
  hallGuideName: { fontWeight: 700, fontSize: "0.8rem", color: "#fda4af" },
  hallGuideText: { fontSize: "0.78rem", color: "#9b9bad", lineHeight: 1.5 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: "1px solid #1f1f2a" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 520, fontSize: "0.85rem" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#12121a",
    color: "#9b9bad",
    fontWeight: 700,
    borderBottom: "1px solid #1f1f2a",
  },
  tdHall: {
    padding: "12px 14px",
    verticalAlign: "top",
    borderBottom: "1px solid #1f1f2a",
    fontWeight: 700,
    width: 168,
    maxWidth: 200,
    color: "#fda4af",
    lineHeight: 1.35,
  },
  tdTimes: { padding: "12px 14px", borderBottom: "1px solid #1f1f2a" },
  timeGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  timeBtn: {
    border: "1px solid #2f2f3d",
    background: "#14141e",
    color: "#ececf1",
    borderRadius: 10,
    padding: "8px 12px",
    minWidth: 108,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  timeBtnOff: { opacity: 0.45, cursor: "not-allowed" },
  timeMain: { fontWeight: 800, fontSize: "0.95rem" },
  timeSub: { fontSize: "0.68rem", color: "#8b8b9c" },
  bookList: { listStyle: "none", padding: 0, margin: "0 0 16px" },
  bookRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "14px 0",
    borderBottom: "1px solid #1f1f2a",
  },
  bookTitle: { margin: "0 0 4px", fontWeight: 700 },
  bookPrice: { margin: 0, fontWeight: 800, color: "#fbbf24" },
  dangerBtn: {
    border: "1px solid #7f1d1d",
    background: "transparent",
    color: "#fca5a5",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: "0.8rem",
  },
  modalRoot: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    border: "none",
    cursor: "pointer",
  },
  modalPanel: {
    position: "relative",
    zIndex: 1,
    width: "min(100%, 520px)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#101018",
    border: "1px solid #2a2a36",
    borderRadius: 16,
    padding: "20px 18px 18px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
  },
  modalTitle: { margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 800 },
  screen: {
    textAlign: "center",
    margin: "16px 0 12px",
    padding: "8px 0",
    borderRadius: 6,
    background: "linear-gradient(90deg,#1e293b,#334155,#1e293b)",
    fontSize: "0.75rem",
    letterSpacing: "0.35em",
    color: "#94a3b8",
    fontWeight: 800,
  },
  seatMap: { display: "flex", flexDirection: "column", gap: 4 },
  seatRow: { display: "flex", alignItems: "center", gap: 4 },
  rowLabel: {
    width: 18,
    fontSize: "0.65rem",
    color: "#6b6b7a",
    textAlign: "center",
  },
  seat: {
    flex: 1,
    maxWidth: 28,
    height: 26,
    padding: 0,
    fontSize: "0.55rem",
    borderRadius: 4,
    border: "1px solid #2f2f3d",
    background: "#1a1a24",
    color: "#9b9bad",
  },
  seatOcc: {
    background: "#0b0b10",
    color: "#3f3f4d",
    cursor: "not-allowed",
    borderColor: "#1f1f2a",
  },
  seatSel: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#3b82f6",
  },
  legend: { display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" },
  lg: { fontSize: "0.72rem", color: "#8b8b9c", display: "inline-flex", alignItems: "center", gap: 6 },
  lgDot: { width: 10, height: 10, borderRadius: 2, display: "inline-block" },
  totalLine: { margin: "14px 0 0", fontSize: "0.9rem" },
  modalActions: { display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" },
  primaryBtn: {
    border: "none",
    background: "linear-gradient(135deg,#fb7185,#f43f5e)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.85rem",
  },
  ghostBtn: {
    border: "1px solid #2f2f3d",
    background: "transparent",
    color: "#c4c4d4",
    padding: "10px 16px",
    borderRadius: 999,
    fontSize: "0.85rem",
  },
  footer: {
    padding: "20px 16px",
    borderTop: "1px solid #1f1f2a",
    fontSize: "0.75rem",
    color: "#6b6b7a",
    maxWidth: 1100,
    margin: "0 auto",
    lineHeight: 1.5,
  },
  snackList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 12,
  },
  snackRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1f1f2a",
    paddingBottom: 10,
  },
  snackName: { fontWeight: 700, fontSize: "0.88rem" },
  snackPrice: { fontSize: "0.75rem", color: "#8b8b9c" },
  snackQty: { display: "flex", alignItems: "center", gap: 8 },
  snackMini: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #2f2f3d",
    background: "#1a1a24",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
