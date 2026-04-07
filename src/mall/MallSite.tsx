import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useAuth } from "../auth/AuthContext";
import FakeCheckoutModal, {
  type CheckoutLine,
} from "../payment/FakeCheckoutModal";
import { formatKrw } from "../lib/format";
import {
  FLOOR_ORDER,
  PRODUCT_CATEGORIES,
  floorLabels,
  floorTabButtonLabel,
  groupFoodByRestaurant,
  martProductCount,
  productSizeKind,
  products,
  productsOnFloor,
  sizeOptionsFor,
  type Product,
  type ProductFloor,
} from "../data/products";
import { formatVisitKo, readAndRecordMallVisit } from "../lib/visitSession";
import type { MallIntentPayload } from "./mallIntent";
import {
  DEMO_ZOOM_URL,
  clearZoomConsult,
  expiresAt,
  getZoomConsult,
  issueZoomConsult,
  isExpired,
  type ZoomConsultRecord,
} from "../zoomConsult";
import MallAmbientDock from "./MallAmbientDock";
import {
  cartLineKey,
  loadCart,
  saveCart,
  type CartLine,
} from "./cartStorage";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "만료됨";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}시간 ${m}분 ${s}초`;
}

function ProductImage({ product }: { product: Product }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div style={styles.imgFallback} role="img" aria-label={product.imageAlt}>
        이미지를 불러올 수 없습니다
      </div>
    );
  }
  return (
    <img
      src={product.imageUrl}
      alt={product.imageAlt}
      style={styles.productImg}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

function formatSizeLine(p: Product, option: string): string {
  if (p.sizePreset === "belt") {
    const role = p.fitGender === "남성" ? "남성 · " : "";
    return `${role}벨트 ${option}cm`;
  }
  if (p.sizePreset === "wrist") {
    const role = p.fitGender === "남성" ? "남성 · " : "";
    return `${role}팔목 ${option}`;
  }
  const k = productSizeKind(p);
  let prefix = "";
  if (p.fitGender === "여성" || p.fitGender === "남성") {
    prefix = `${p.fitGender} · `;
  } else if (p.fitGender === "키즈") {
    prefix = "키즈 · ";
  }
  if (k === "shoe") return `${prefix}${option}mm`;
  return `${prefix}사이즈 ${option}`;
}

function sizeFieldCopy(p: Product, kind: "clothing" | "shoe") {
  if (p.sizePreset === "belt") {
    return { label: "허리 둘레(cm)", aria: "벨트 허리 둘레 cm" };
  }
  if (p.sizePreset === "wrist") {
    return { label: "팔목 둘레(S/M/L)", aria: "팔찌 팔목 사이즈" };
  }
  const g = p.fitGender;
  if (kind === "shoe") {
    if (g === "여성")
      return {
        label: "여성 신발(mm, 5mm 단위)",
        aria: "여성 신발 한국 mm 사이즈",
      };
    if (g === "남성")
      return {
        label: "남성 신발(mm, 5mm 단위)",
        aria: "남성 신발 한국 mm 사이즈",
      };
    if (g === "키즈")
      return {
        label: "키즈 신발(mm, 5mm 단위)",
        aria: "키즈 신발 한국 mm 사이즈",
      };
    return { label: "신발(mm, 5mm 단위)", aria: "신발 한국 mm 사이즈" };
  }
  if (g === "여성") return { label: "여성 의류 사이즈", aria: "여성 의류 사이즈" };
  if (g === "남성") return { label: "남성 의류 사이즈", aria: "남성 의류 사이즈" };
  if (g === "키즈") return { label: "키즈 의류 사이즈", aria: "키즈 의류 사이즈" };
  if (g === "공용") return { label: "의류 사이즈(공용)", aria: "의류 사이즈" };
  return { label: "사이즈", aria: "의류 사이즈" };
}

function ProductCardMall({
  p,
  onDetail,
  onAdd,
}: {
  p: Product;
  onDetail: (id: string) => void;
  onAdd: (p: Product, option?: string) => void;
}) {
  const opts = sizeOptionsFor(p);
  const needSize = opts.length > 0;
  const kind = productSizeKind(p);
  const sizeCopy = needSize && kind ? sizeFieldCopy(p, kind) : null;
  const [opt, setOpt] = useState(() => opts[0] ?? "");

  useEffect(() => {
    setOpt(sizeOptionsFor(p)[0] ?? "");
  }, [p.id]);

  return (
    <article className="mall-product-card" style={styles.card}>
      <div style={styles.imgWrap}>
        <ProductImage product={p} />
        {p.floor >= 1 &&
        p.floor <= 3 &&
        p.id.startsWith("p") &&
        p.id.endsWith("1") ? (
          <span style={styles.badge}>BEST</span>
        ) : null}
      </div>
      <h3 style={styles.cardTitle}>{p.name}</h3>
      <p style={styles.cardMeta}>
        {floorLabels[p.floor].title} · {p.category}
        {p.restaurant ? ` · ${p.restaurant}` : ""}
        {p.fitGender === "여성" ||
        p.fitGender === "남성" ||
        p.fitGender === "키즈"
          ? ` · ${p.fitGender}`
          : p.fitGender === "공용"
            ? " · 공용"
            : ""}
      </p>
      <p style={styles.cardDesc}>{p.description}</p>
      <p style={styles.price}>{formatKrw(p.price)}</p>
      {needSize && sizeCopy ? (
        <label style={styles.sizeRow}>
          <span style={styles.sizeLabel}>{sizeCopy.label}</span>
          <select
            value={opt}
            onChange={(e) => setOpt(e.target.value)}
            style={styles.sizeSelect}
            aria-label={sizeCopy.aria}
          >
            {opts.map((s) => (
              <option key={s} value={s}>
                {kind === "shoe" ? `${s}mm` : s}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div style={styles.cardActions}>
        <button
          type="button"
          style={styles.secondaryBtn}
          onClick={() => onDetail(p.id)}
        >
          상세
        </button>
        <button
          type="button"
          style={styles.primaryBtn}
          onClick={() => onAdd(p, needSize ? opt : undefined)}
        >
          담기
        </button>
      </div>
    </article>
  );
}

const BEST_PRODUCT_IDS = new Set([
  "p1",
  "p4",
  "p17",
  "p33",
  "p37",
  "p49",
]);

export default function MallSite(props?: {
  intentVersion?: number;
  intent?: MallIntentPayload;
}) {
  const intentVersion = props?.intentVersion ?? 0;
  const intent = props?.intent;
  const { isAdmin } = useAuth();
  const [payOpen, setPayOpen] = useState(false);
  const [floorTab, setFloorTab] = useState<"전체" | ProductFloor>("전체");
  const [category, setCategory] = useState<string>("전체");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>(() => loadCart());
  const [zoom, setZoom] = useState<ZoomConsultRecord | null>(() =>
    getZoomConsult()
  );
  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const visitInfo = useMemo(() => readAndRecordMallVisit(), []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    if (intentVersion < 1) return;
    if (!intent || Object.keys(intent).length === 0) return;
    if (intent.floorTab !== undefined) setFloorTab(intent.floorTab);
    if (intent.category !== undefined) setCategory(intent.category);
    const t = window.setTimeout(() => {
      const map = {
        best: "mall-section-best",
        event: "mall-section-event",
        cart: "mall-section-cart",
        products: "products-heading",
        zoom: "zoom-heading",
      } as const;
      if (intent.scrollTo) {
        const id = map[intent.scrollTo];
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else if (intent.scrollToFloor !== undefined) {
        const tab = intent.floorTab;
        if (tab === "전체" || tab === undefined) {
          document
            .getElementById(`floor-${intent.scrollToFloor}`)
            ?.scrollIntoView({ behavior: "smooth" });
        } else if (tab === intent.scrollToFloor) {
          document
            .getElementById("products-heading")
            ?.scrollIntoView({ behavior: "smooth" });
        }
      } else if (intent.floorTab !== undefined && intent.floorTab !== "전체") {
        document
          .getElementById("products-heading")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [intentVersion, intent]);

  const bestPicks = useMemo(
    () => products.filter((p) => BEST_PRODUCT_IDS.has(p.id)),
    []
  );

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const matchesCategory = useCallback(
    (p: Product) => category === "전체" || p.category === category,
    [category]
  );

  const matchesSearch = useCallback(
    (p: Product) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const rest = p.restaurant?.toLowerCase() ?? "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (rest.length > 0 && rest.includes(q))
      );
    },
    [search]
  );

  const filteredOneFloor = useMemo(() => {
    if (floorTab === "전체") return [];
    return productsOnFloor(floorTab)
      .filter(matchesCategory)
      .filter(matchesSearch);
  }, [floorTab, matchesCategory, matchesSearch]);

  const floorBlocks = useMemo(() => {
    return FLOOR_ORDER.map((f) => ({
      floor: f,
      items: productsOnFloor(f)
        .filter(matchesCategory)
        .filter(matchesSearch),
    })).filter((b) => b.items.length > 0);
  }, [matchesCategory, matchesSearch]);

  const detailProduct = useMemo(
    () => (detailId ? products.find((p) => p.id === detailId) ?? null : null),
    [detailId]
  );

  const [detailOption, setDetailOption] = useState("");

  useEffect(() => {
    if (!detailProduct) {
      setDetailOption("");
      return;
    }
    const o = sizeOptionsFor(detailProduct);
    setDetailOption(o[0] ?? "");
  }, [detailProduct?.id]);

  const cartCount = useMemo(
    () => cart.reduce((n, l) => n + l.qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.product.price * l.qty, 0),
    [cart]
  );

  const checkoutLines = useMemo((): CheckoutLine[] => {
    return cart.map((l) => {
      const sizePart = l.option
        ? formatSizeLine(l.product, l.option)
        : null;
      const detail = [
        floorLabels[l.product.floor].title,
        l.product.category,
        sizePart,
        `×${l.qty}`,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        label: l.product.name,
        detail,
        won: l.product.price * l.qty,
      };
    });
  }, [cart]);

  const handleOrderPaid = useCallback(() => {
    setCart([]);
  }, []);

  const addToCart = useCallback((p: Product, option?: string) => {
    const opts = sizeOptionsFor(p);
    const need = opts.length > 0;
    const resolved = need ? (option ?? opts[0]) : undefined;
    setCart((prev) => {
      const i = prev.findIndex(
        (l) =>
          l.product.id === p.id && (l.option ?? "") === (resolved ?? "")
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { product: p, qty: 1, option: resolved }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number, option?: string) => {
    const keyOpt = option ?? "";
    setCart((prev) => {
      if (qty <= 0) {
        return prev.filter(
          (l) => !(l.product.id === id && (l.option ?? "") === keyOpt)
        );
      }
      return prev.map((l) =>
        l.product.id === id && (l.option ?? "") === keyOpt
          ? { ...l, qty }
          : l
      );
    });
  }, []);

  const issueZoom = useCallback(() => {
    const rec = issueZoomConsult(DEMO_ZOOM_URL);
    setZoom(rec);
  }, []);

  const revokeZoom = useCallback(() => {
    clearZoomConsult();
    setZoom(null);
  }, []);

  const zoomExpired = zoom ? isExpired(zoom, now) : false;
  const zoomRemainingMs = zoom ? Math.max(0, expiresAt(zoom) - now) : 0;

  const renderProductCard = useCallback(
    (p: Product) => (
      <ProductCardMall
        key={p.id}
        p={p}
        onDetail={setDetailId}
        onAdd={addToCart}
      />
    ),
    [addToCart]
  );

  const renderFloorGrid = useCallback(
    (floor: ProductFloor, items: Product[]) => {
      if (items.length === 0) return null;

      if (floor === 9) {
        const groups = groupFoodByRestaurant(items);
        const ungroupedFood = items.filter(
          (p) => p.category === "식품" && !p.restaurant
        );
        const nonFood = items.filter((p) => p.category !== "식품");
        return (
          <>
            {groups.map((g) => (
              <section
                key={g.restaurant}
                style={styles.foodRestaurantBlock}
                aria-label={`입점 ${g.restaurant}`}
              >
                <h4 style={styles.foodRestaurantTitle}>{g.restaurant}</h4>
                <p style={styles.foodRestaurantSub}>푸드코트 메뉴</p>
                <div style={styles.grid}>
                  {g.items.map((p) => renderProductCard(p))}
                </div>
              </section>
            ))}
            {ungroupedFood.length > 0 ? (
              <div style={styles.grid}>
                {ungroupedFood.map((p) => renderProductCard(p))}
              </div>
            ) : null}
            {nonFood.length > 0 ? (
              <div style={styles.grid}>
                {nonFood.map((p) => renderProductCard(p))}
              </div>
            ) : null}
          </>
        );
      }

      if (floor === 10) {
        const movie = items.filter((p) => p.category === "영화");
        const snacks = items.filter((p) => p.category === "매점");
        const other = items.filter(
          (p) => p.category !== "영화" && p.category !== "매점"
        );
        return (
          <>
            {movie.length > 0 ? (
              <>
                <h4 style={styles.subFloorHeading}>관람권 · 굿즈</h4>
                <div style={styles.grid}>
                  {movie.map((p) => renderProductCard(p))}
                </div>
              </>
            ) : null}
            {snacks.length > 0 ? (
              <>
                <h4 style={styles.subFloorHeading}>세현 시네마 매점</h4>
                <p style={styles.foodRestaurantSub}>
                  팝콘·간식은 상영 전 매점에서 수령(데모 주문).
                </p>
                <div style={styles.grid}>
                  {snacks.map((p) => renderProductCard(p))}
                </div>
              </>
            ) : null}
            {other.length > 0 ? (
              <div style={styles.grid}>
                {other.map((p) => renderProductCard(p))}
              </div>
            ) : null}
          </>
        );
      }

      return <div style={styles.grid}>{items.map((p) => renderProductCard(p))}</div>;
    },
    [renderProductCard]
  );

  return (
    <div className="mall-root" style={styles.page}>
      <div className="mall-promo" role="note">
        <span>
          🎁 첫 구매 무료배송 · B1 세현마트 · 9F 푸드코트 · 10F 시네마 · 12F
          라운지 (데모)
        </span>
      </div>

      <header className="mall-topbar">
        <div className="mall-topbar-inner">
          <div style={styles.mallBrand}>
            <span style={styles.mallBrandKo}>세현몰</span>
            <span style={styles.mallBrandEn}>12F Lifestyle Complex</span>
          </div>
          <label className="mall-search" htmlFor="mall-search-input">
            <span aria-hidden style={{ opacity: 0.5 }}>
              🔍
            </span>
            <input
              id="mall-search-input"
              type="search"
              placeholder="상품명, 카테고리, 입점명(식당), 설명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </label>
          <nav className="mall-quick-nav" aria-label="빠른 메뉴">
            <button
              type="button"
              className="mall-nav-link mall-nav-link-btn"
              onClick={() => {
                setFloorTab("전체");
                setCategory("전체");
                scrollToId("mall-section-best");
              }}
            >
              베스트
            </button>
            <button
              type="button"
              className="mall-nav-link mall-nav-link-btn"
              onClick={() => scrollToId("mall-section-event")}
            >
              이벤트
            </button>
            <button
              type="button"
              className="mall-nav-link mall-nav-link-btn"
              onClick={() => scrollToId("mall-section-cart")}
            >
              주문배송
            </button>
            <button
              type="button"
              className="mall-cart-pill mall-cart-pill-btn"
              aria-live="polite"
              onClick={() => scrollToId("mall-section-cart")}
            >
              장바구니 <strong>{cartCount}</strong>
            </button>
          </nav>
        </div>
      </header>

      <div className="mall-trust">
        <span>오늘출발</span>
        <span>무료반품</span>
        <span>Zoom 1:1 상담</span>
        <span>안심결제(데모)</span>
      </div>

      <div className="mall-visit-strip" role="status" aria-live="polite">
        <span className="mall-visit-strip__main">
          이번 탭 접속 {formatVisitKo(visitInfo.tabSessionAt)}
        </span>
        {visitInfo.previousVisitAt ? (
          <span className="mall-visit-strip__prev">
            직전 방문 {formatVisitKo(visitInfo.previousVisitAt)}
          </span>
        ) : (
          <span className="mall-visit-strip__prev">
            첫 방문이에요 — 환영합니다!
          </span>
        )}
        <span className="mall-visit-strip__mart">
          B1 세현마트 데모 품목 <strong>{martProductCount}</strong>종
        </span>
      </div>

      <main style={styles.main}>
        <section
          id="mall-section-event"
          style={styles.section}
          aria-labelledby="event-heading"
        >
          <h2 id="event-heading" style={styles.h2}>
            이벤트
          </h2>
          <div style={styles.eventGrid}>
            <article style={styles.eventCard}>
              <h3 style={styles.eventTitle}>봄맞이 10% 쿠폰</h3>
              <p style={styles.eventBody}>
                결제 전 관리자 데모 승인 시 적용 가정. 코드{" "}
                <code style={styles.code}>SPRING10</code>
              </p>
            </article>
            <article style={{ ...styles.eventCard, ...styles.eventCardAlt }}>
              <h3 style={styles.eventTitle}>시네마 콤보 연동</h3>
              <p style={styles.eventBody}>
                상단 「세현 시네마」에서 예매 후 매점 콤보 담기(데모).
              </p>
            </article>
            <article style={styles.eventCard}>
              <h3 style={styles.eventTitle}>Zoom 상담 48h</h3>
              <p style={styles.eventBody}>
                아래 화상 상담 링크는 발급 후 48시간만 유효합니다.
              </p>
            </article>
          </div>
        </section>

        <section
          id="mall-section-best"
          style={styles.section}
          aria-labelledby="best-heading"
        >
          <h2 id="best-heading" style={styles.h2}>
            베스트
          </h2>
          <p style={styles.lead}>이번 주 많이 찾는 상품(데모 큐레이션).</p>
          <div style={styles.grid}>
            {bestPicks.map((p) => renderProductCard(p))}
          </div>
        </section>

        <section style={styles.section} aria-labelledby="products-heading">
          <h2 id="products-heading" style={styles.h2}>
            쇼핑 홈
          </h2>
          <p style={styles.lead}>
            B1 세현마트부터 12F 스카이 라운지까지 층별 매장을 탐색합니다.
            9F는 입점별 푸드코트 메뉴로 묶여 있습니다.
          </p>

          <p style={styles.filterLabel}>층 (B1 ~ 12F)</p>
          <div style={styles.floorGrid}>
            <button
              type="button"
              onClick={() => setFloorTab("전체")}
              style={{
                ...styles.floorBtn,
                ...(floorTab === "전체" ? styles.floorBtnActive : {}),
              }}
            >
              전체
            </button>
            {FLOOR_ORDER.map((f) => {
              const fl = floorLabels[f];
              return (
                <button
                  key={f}
                  type="button"
                  title={`${fl.title} · ${fl.subtitle}`}
                  onClick={() => setFloorTab(f)}
                  style={{
                    ...styles.floorBtn,
                    ...(floorTab === f ? styles.floorBtnActive : {}),
                  }}
                >
                  <span style={styles.floorBtnNum}>
                    {floorTabButtonLabel(f)}
                  </span>
                  <span style={styles.floorBtnSub}>
                    {fl.subtitle.split(" · ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <p style={styles.filterLabel}>카테고리</p>
          <div style={styles.categoryScroll}>
            {(["전체", ...PRODUCT_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  ...styles.filterBtn,
                  ...(category === c ? styles.filterBtnActive : {}),
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {detailProduct && (
            <div style={styles.detailPanel}>
              <div className="detail-grid-responsive">
                <div style={styles.detailImgWrap}>
                  <ProductImage product={detailProduct} />
                </div>
                <div>
                  <h3 style={styles.detailTitle}>{detailProduct.name}</h3>
                  <p style={styles.muted}>
                    {floorLabels[detailProduct.floor].title} ·{" "}
                    {floorLabels[detailProduct.floor].subtitle} ·{" "}
                    {detailProduct.category}
                  </p>
                  {detailProduct.restaurant ? (
                    <p style={styles.detailOutlet}>
                      입점 · {detailProduct.restaurant}
                    </p>
                  ) : null}
                  <p style={styles.detailPrice}>{formatKrw(detailProduct.price)}</p>
                  <p style={styles.detailDesc}>{detailProduct.description}</p>
                  {(() => {
                    const dOpts = sizeOptionsFor(detailProduct);
                    const dKind = productSizeKind(detailProduct);
                    if (dOpts.length === 0 || !dKind) return null;
                    const sc = sizeFieldCopy(detailProduct, dKind);
                    return (
                      <label style={styles.detailSizeRow}>
                        <span style={styles.sizeLabel}>{sc.label}</span>
                        <select
                          value={detailOption}
                          onChange={(e) => setDetailOption(e.target.value)}
                          style={styles.sizeSelect}
                          aria-label={sc.aria}
                        >
                          {dOpts.map((s) => (
                            <option key={s} value={s}>
                              {dKind === "shoe" ? `${s}mm` : s}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })()}
                  <div style={styles.detailActions}>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      onClick={() =>
                        addToCart(
                          detailProduct,
                          sizeOptionsFor(detailProduct).length > 0
                            ? detailOption
                            : undefined
                        )
                      }
                    >
                      장바구니 담기
                    </button>
                    <button
                      type="button"
                      style={styles.ghostBtn}
                      onClick={() => setDetailId(null)}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {floorTab === "전체" ? (
            floorBlocks.length === 0 ? (
              <p style={styles.muted}>조건에 맞는 상품이 없습니다.</p>
            ) : (
              floorBlocks.map(({ floor, items }) => (
                <section
                  key={floor}
                  id={`floor-${floor}`}
                  style={styles.floorSection}
                >
                  <h3 style={styles.floorHeading}>
                    {floorLabels[floor].title}{" "}
                    <span style={styles.floorSub}>
                      {floorLabels[floor].subtitle}
                    </span>
                  </h3>
                  {renderFloorGrid(floor, items)}
                </section>
              ))
            )
          ) : filteredOneFloor.length === 0 ? (
            <p style={styles.muted}>이 층에 표시할 상품이 없습니다.</p>
          ) : (
            renderFloorGrid(floorTab, filteredOneFloor)
          )}
        </section>

        <section style={styles.section} aria-labelledby="zoom-heading">
          <h2 id="zoom-heading" style={styles.h2}>
            Zoom 화상 상담 (48시간 유효)
          </h2>
          <div style={styles.zoomBox}>
            <p style={styles.muted}>
              발급 시점부터 <strong>48시간</strong> 동안만 참여 링크를 사용할 수
              있습니다. 만료 후에는 링크가 비활성화됩니다.
            </p>
            {!zoom && (
              <button type="button" style={styles.primaryBtn} onClick={issueZoom}>
                상담 링크 발급
              </button>
            )}
            {zoom && !zoomExpired && (
              <>
                <p style={styles.countdown}>
                  남은 시간: <strong>{formatRemaining(zoomRemainingMs)}</strong>
                </p>
                <p style={styles.muted}>
                  만료 시각:{" "}
                  {new Date(expiresAt(zoom)).toLocaleString("ko-KR")}
                </p>
                <a
                  href={zoom.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.linkBtn}
                >
                  Zoom 참여하기
                </a>
                <button type="button" style={styles.ghostBtn} onClick={revokeZoom}>
                  발급 기록 삭제
                </button>
              </>
            )}
            {zoom && zoomExpired && (
              <>
                <p style={styles.expired}>이 상담 링크는 만료되어 비활성화되었습니다.</p>
                <p style={styles.muted}>
                  새 상담이 필요하면 아래에서 다시 발급해 주세요.
                </p>
                <button type="button" style={styles.primaryBtn} onClick={issueZoom}>
                  상담 링크 재발급
                </button>
                <button type="button" style={styles.ghostBtn} onClick={revokeZoom}>
                  기록 지우기
                </button>
              </>
            )}
          </div>
        </section>

        <section
          id="mall-section-cart"
          style={styles.section}
          aria-labelledby="cart-heading"
        >
          <h2 id="cart-heading" style={styles.h2}>
            장바구니
          </h2>
          {cart.length === 0 ? (
            <p style={styles.muted}>담긴 상품이 없습니다.</p>
          ) : (
            <>
              <ul style={styles.cartList}>
                {cart.map((l) => (
                  <li key={cartLineKey(l)} style={styles.cartRow}>
                    <span>
                      {l.product.name}
                      {l.option ? (
                        <span style={styles.cartOption}>
                          {formatSizeLine(l.product, l.option)}
                        </span>
                      ) : null}
                    </span>
                    <span style={styles.cartQty}>
                      <button
                        type="button"
                        style={styles.miniBtn}
                        onClick={() =>
                          setQty(l.product.id, l.qty - 1, l.option)
                        }
                        aria-label="수량 감소"
                      >
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button
                        type="button"
                        style={styles.miniBtn}
                        onClick={() =>
                          setQty(l.product.id, l.qty + 1, l.option)
                        }
                        aria-label="수량 증가"
                      >
                        +
                      </button>
                    </span>
                    <span>{formatKrw(l.product.price * l.qty)}</span>
                  </li>
                ))}
              </ul>
              <p style={styles.cartTotal}>
                합계 <strong>{formatKrw(cartTotal)}</strong>
              </p>
              <p style={styles.muted}>
                가짜 결제는 <strong>관리자 로그인(ksh011)</strong> 후에만 완료됩니다.
                장바구니는 브라우저 로컬에 저장됩니다.
              </p>
              <button
                type="button"
                style={styles.orderBtn}
                onClick={() => setPayOpen(true)}
              >
                주문하기 · 가짜 결제
              </button>
              {!isAdmin ? (
                <p style={styles.warn}>
                  현재 비관리자 세션 — 결제 시도 시 안내 메시지가 뜹니다.
                </p>
              ) : null}
            </>
          )}
        </section>
      </main>

      <FakeCheckoutModal
        open={payOpen}
        title="세현몰 · 주문 결제(데모)"
        lines={checkoutLines}
        onClose={() => setPayOpen(false)}
        onPaid={handleOrderPaid}
        successTitle="주문 · 결제가 완료되었습니다"
        successSubtitle="데모 전자영수증이 발급되었습니다. 배송·픽업은 시뮬레이션입니다."
      />

      <footer style={styles.footer}>
        세현몰 · 쿠팡·무신사·SSG 등 이커머스의 검색·카테고리·장바구니 패턴을 참고한
        데모입니다. 요구사항은 <code>세현몰_PRD_v13.md</code>
      </footer>

      <MallAmbientDock />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
  },
  mallBrand: { display: "flex", flexDirection: "column", gap: 2 },
  mallBrandKo: { fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" },
  mallBrandEn: { fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.08em" },
  main: {
    flex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "1.25rem 1.25rem 3rem",
    width: "100%",
  },
  section: { marginBottom: "2.5rem" },
  h2: { fontSize: "1.15rem", margin: "0 0 0.5rem" },
  lead: {
    margin: "0 0 1rem",
    fontSize: "0.9rem",
    color: "var(--muted)",
    lineHeight: 1.55,
  },
  eventGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
    gap: "0.75rem",
  },
  eventCard: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "0.85rem 1rem",
    background: "var(--surface)",
  },
  eventCardAlt: {
    borderColor: "rgba(196, 92, 62, 0.45)",
    background: "rgba(196, 92, 62, 0.06)",
  },
  eventTitle: { margin: "0 0 0.35rem", fontSize: "0.95rem", fontWeight: 700 },
  eventBody: {
    margin: 0,
    fontSize: "0.82rem",
    color: "var(--muted)",
    lineHeight: 1.5,
  },
  code: {
    fontSize: "0.8rem",
    background: "var(--border)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  filterLabel: {
    margin: "0 0 0.35rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  floorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(4.5rem, 1fr))",
    gap: "0.4rem",
    marginBottom: "1rem",
    maxWidth: "100%",
  },
  floorBtn: {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: "0.35rem 0.25rem",
    borderRadius: 8,
    fontSize: "0.7rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.1rem",
    lineHeight: 1.2,
    minHeight: 52,
    justifyContent: "center",
  },
  floorBtnNum: { fontWeight: 700, fontSize: "0.8rem" },
  floorBtnSub: {
    fontSize: "0.62rem",
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  },
  floorBtnActive: {
    borderColor: "var(--accent)",
    background: "rgba(196, 92, 62, 0.1)",
    boxShadow: "inset 0 0 0 1px var(--accent)",
  },
  categoryScroll: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem",
    marginBottom: "1rem",
    overflowX: "auto",
    paddingBottom: "0.15rem",
    WebkitOverflowScrolling: "touch",
  },
  filterBtn: {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: "0.4rem 0.75rem",
    borderRadius: 999,
    fontSize: "0.78rem",
    textAlign: "left",
    flexShrink: 0,
  },
  filterBtnActive: {
    background: "var(--text)",
    color: "#fff",
    borderColor: "var(--text)",
  },
  floorSection: {
    marginBottom: "2rem",
    scrollMarginTop: "5.5rem",
  },
  floorHeading: {
    fontSize: "1.05rem",
    margin: "0 0 0.75rem",
    fontWeight: 700,
    borderLeft: "4px solid var(--accent)",
    paddingLeft: "0.65rem",
  },
  floorSub: {
    fontWeight: 500,
    color: "var(--muted)",
    fontSize: "0.9rem",
  },
  subFloorHeading: {
    fontSize: "0.95rem",
    margin: "1rem 0 0.5rem",
    fontWeight: 700,
    color: "var(--text)",
  },
  foodRestaurantBlock: {
    marginBottom: "1.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px dashed var(--border)",
  },
  foodRestaurantTitle: {
    margin: "0 0 0.15rem",
    fontSize: "1rem",
    fontWeight: 700,
  },
  foodRestaurantSub: {
    margin: "0 0 0.65rem",
    fontSize: "0.8rem",
    color: "var(--muted)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
    gap: "1rem",
  },
  card: {
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    position: "relative",
  },
  imgWrap: {
    aspectRatio: "4 / 3",
    borderRadius: 8,
    overflow: "hidden",
    background: "#e8e4de",
    marginBottom: "0.25rem",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    background: "var(--accent)",
    color: "#fff",
    fontSize: "0.65rem",
    fontWeight: 800,
    padding: "3px 7px",
    borderRadius: 4,
    letterSpacing: "0.04em",
  },
  productImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  imgFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    color: "var(--muted)",
    padding: "0.5rem",
    textAlign: "center",
  },
  cardTitle: { fontSize: "0.95rem", margin: 0, fontWeight: 600 },
  cardMeta: { margin: 0, fontSize: "0.75rem", color: "var(--muted)" },
  cardDesc: {
    margin: 0,
    fontSize: "0.8rem",
    flex: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  price: { margin: "0.15rem 0 0", fontWeight: 600, fontSize: "0.95rem" },
  sizeRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
    marginTop: "0.15rem",
  },
  sizeLabel: { fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 },
  sizeSelect: {
    width: "100%",
    padding: "0.4rem 0.5rem",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontSize: "0.85rem",
  },
  cardActions: { display: "flex", gap: "0.5rem", marginTop: "0.25rem" },
  secondaryBtn: {
    flex: 1,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    padding: "0.5rem 0.5rem",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.8rem",
  },
  primaryBtn: {
    flex: 1,
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    padding: "0.55rem 0.75rem",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.8rem",
  },
  ghostBtn: {
    border: "1px solid var(--border)",
    background: "transparent",
    padding: "0.45rem 0.75rem",
    borderRadius: 8,
    fontSize: "0.8rem",
  },
  detailPanel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1rem",
    marginBottom: "1.5rem",
  },
  detailImgWrap: {
    aspectRatio: "16 / 10",
    borderRadius: 8,
    overflow: "hidden",
    background: "#e8e4de",
    maxHeight: 280,
  },
  detailTitle: { margin: "0 0 0.35rem", fontSize: "1.2rem" },
  detailPrice: { fontSize: "1.1rem", fontWeight: 700, margin: "0.5rem 0" },
  detailDesc: { margin: 0, fontSize: "0.95rem", lineHeight: 1.6 },
  detailOutlet: {
    margin: "0.35rem 0 0",
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "var(--accent)",
  },
  detailSizeRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.35rem",
    marginTop: "0.75rem",
  },
  detailActions: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" },
  zoomBox: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  muted: { margin: 0, color: "var(--muted)", fontSize: "0.9rem" },
  countdown: { margin: 0, fontSize: "1rem" },
  expired: { margin: 0, color: "var(--accent-dim)", fontWeight: 600 },
  linkBtn: {
    display: "inline-block",
    background: "#2d8cff",
    color: "#fff",
    textDecoration: "none",
    padding: "0.55rem 1rem",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  cartList: { listStyle: "none", padding: 0, margin: "0 0 1rem" },
  cartRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "0.75rem",
    alignItems: "center",
    padding: "0.65rem 0",
    borderBottom: "1px solid var(--border)",
    fontSize: "0.9rem",
  },
  cartOption: {
    display: "block",
    marginTop: "0.2rem",
    fontSize: "0.78rem",
    color: "var(--muted)",
  },
  cartQty: { display: "flex", alignItems: "center", gap: "0.35rem" },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    lineHeight: 1,
  },
  cartTotal: { fontSize: "1rem", margin: "0 0 0.5rem" },
  orderBtn: {
    marginTop: "0.75rem",
    border: "none",
    background: "var(--text)",
    color: "#fff",
    padding: "0.65rem 1.1rem",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  warn: {
    margin: "0.5rem 0 0",
    fontSize: "0.78rem",
    color: "#b45309",
  },
  footer: {
    padding: "1rem 1.25rem",
    borderTop: "1px solid var(--border)",
    fontSize: "0.8rem",
    color: "var(--muted)",
    background: "var(--surface)",
    lineHeight: 1.5,
  },
};
