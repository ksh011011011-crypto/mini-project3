/**
 * 외부 API 없이 동작하는 로컬 "AI 느낌" 응답기.
 * - 동의어·오타 정규화, 키워드·패턴 점수로 의도 추정
 * - 직전 턴 의도를 기억해 "그거", "자세히" 등 후속 질문 처리
 * - 같은 의도라도 여러 문장 중 랜덤 선택
 */

export type ChatbotPortal = "mall" | "cinema" | "concert";

export type BrainContext = {
  lastIntentId: string | null;
  turnIndex: number;
  /** 인사로 응답한 횟수(같은 대화에서 톤을 바꿀 때 사용) */
  greetExchangeCount: number;
};

const SYNONYM_PAIRS: [string, string][] = [
  ["결재", "결제"],
  ["예역", "예매"],
  ["예매해", "예매"],
  ["티켓팅", "예매"],
  ["영화관", "영화"],
  ["멀티플렉스", "시네마"],
  ["cgv", "시네마"],
  ["메가박스", "시네마"],
  ["쇼핑몰", "몰"],
  ["마켓", "마트"],
  ["식품", "마트"],
  ["콘서트홀", "콘서트"],
  ["공연장", "콘서트"],
  ["주차료", "주차"],
  ["주차공간", "주차"],
  ["비번", "비밀번호"],
  ["암호", "비밀번호"],
  ["관리자모드", "관리자"],
  ["어드민", "관리자"],
];

/** 비속어·욕설이 포함된 경우 true. 답변에서는 해당 표현을 되풀이하지 않습니다. */
function containsDisrespectfulLanguage(s: string): boolean {
  return /시발|씨발|ㅅㅂ|ㅄ|좆|좃|병신|개새|개같|지랄|좃같|존나|ㅂㅅ|fuck|shit|bitch|cunt|damn/i.test(
    s
  );
}

function normalize(raw: string): string {
  let s = raw.trim().toLowerCase();
  try {
    s = s.normalize("NFKC");
  } catch {
    /* noop */
  }
  s = s.replace(/[\s\u200b]+/g, " ");
  for (const [a, b] of SYNONYM_PAIRS) {
    if (a.length >= 2) {
      s = s.split(a).join(b);
    }
  }
  return s;
}

type IntentDef = {
  id: string;
  /** 정규화된 문자열에 부분 일치시 가중치 */
  keywords: string[];
  /** 추가 점수 */
  patterns?: RegExp[];
  /** 이 포털에서만 가산점 */
  portalBonus?: ChatbotPortal[];
  replies: string[];
  /** 후속 질문(그거, 자세히)용 짧은 답 */
  followUpReplies?: string[];
};

const INTENTS: IntentDef[] = [
  {
    id: "farewell",
    keywords: ["안녕히", "잘가", "바이바이", "bye", "ㅂㅂ", "들어가", "퇴근"],
    patterns: [/안녕히/, /잘\s*가/, /또\s*봐/],
    replies: [
      "👋 안녕히 가세요. 다시 찾아주시면 정중히 안내해 드리겠습니다.",
      "🌿 편안한 하루 보내세요. 궁금하신 점이 생기시면 언제든지 말씀해 주세요.",
      "✨ 감사합니다. 다음에 또 뵙기를 바랍니다.",
    ],
  },
  {
    id: "greet",
    keywords: [
      "안녕하세요",
      "안녕하십",
      "안녕",
      "안뇽",
      "hello",
      "hi",
      "헬로",
      "헬로우",
      "반가",
      "반갑",
      "하이",
      "방가",
      "인사",
      "처음",
      "왔어",
      "들어왔",
      "잘부탁",
      "부탁드립",
      "오랜만",
      "오래간만",
      "반갑습",
      "반가워",
      "yo",
      "굿모닝",
      "좋은아침",
      "좋은저녁",
      "좋은밤",
      "점심",
      "저녁",
    ],
    patterns: [
      /^\s*ㅎㅇ\s*$/,
      /^\s*(yo|hi|hello)\s*$/i,
      /안녕(?!히)/,
      /하이\s*[!.~]*/,
      /헬로\s*[!.~]*/,
      /반가(워|습)/,
      /잘\s*부탁/,
      /처음\s*(와|왔|봐)/,
      /들어왔/,
    ],
    portalBonus: ["mall", "cinema", "concert"],
    replies: [
      "👋 안녕하세요! 세현 복합 단지 데모 안내를 정중히 도와드리겠습니다 ✨",
      "🙂 반갑습니다. 편하실 때 궁금하신 점을 말씀해 주세요.",
    ],
    followUpReplies: [
      "💬 다시 인사해 주셔서 감사합니다. 이어서 주차·예매·결제·콘서트 중 편한 주제로 말씀해 주시면 안내해 드리겠습니다.",
      "🙌 또 인사 주셔서 기쁩니다. 구체적인 키워드를 덧붙여 주시면 더 정확히 도와드릴 수 있습니다.",
      "✨ 언제든지 편히 인사해 주세요. 그다음에는 궁금하신 메뉴를 말씀해 주시면 감사하겠습니다.",
    ],
  },
  {
    id: "thanks",
    keywords: ["고마", "감사", "thx", "thanks", "ㄳ", "수고"],
    replies: [
      "🙂 천만에요. 다른 궁금하신 점이 있으시면 언제든지 말씀해 주세요.",
      "💛 도움이 되셨다니 저도 기쁩니다. 추가로 안내가 필요하시면 편히 여쭤 주시기 바랍니다.",
    ],
  },
  {
    id: "payment_admin",
    keywords: [
      "결제",
      "카드",
      "승인",
      "관리자",
      "ksh011",
      "로그인",
      "비밀번호",
      "주문완료",
      "결제안",
      "결제가안",
      "못결제",
    ],
    patterns: [/lms990302/],
    replies: [
      "데모에서는 예매·주문 결제 완료가 관리자 로그인 후에만 가능합니다. 상단에서 아이디 ksh011, 비밀번호(과제용)로 로그인하신 뒤 결제를 다시 시도해 보시기 바랍니다. 손님 모드에서는 안내 문구만 표시되는 것이 정상입니다.",
      "가짜 결제 창은 보안 연습용입니다. 관리자 세션일 때만 승인부터 완료까지 진행됩니다. 로그인 영역에서 관리자로 전환해 주시면 됩니다.",
      "결제가 진행되지 않는다면 대개 비관리자 상태이신 경우가 많습니다. 로그아웃 후 관리자 계정으로 다시 로그인해 보시길 권해 드립니다.",
    ],
    followUpReplies: [
      "관리자로 로그인하신 경우에만 영수증 확인 단계까지 진행하실 수 있습니다. 그래도 어려우시면 페이지를 새로고침하신 뒤 한 번 더 시도해 보세요.",
    ],
  },
  {
    id: "parking",
    keywords: ["주차", "parking", "주차장", "b1", "b2", "b3", "잔여"],
    replies: [
      "복합 단지 상단 시설 줄에서 「지하 주차」를 누르시면 층별 잔여(데모 수치) 화면으로 이동하실 수 있습니다. 실시간 연동은 아니며 시연용으로 고정된 값입니다.",
      "주차 안내는 별도 페이지로 이동합니다. 복합 단지 화면으로 돌아가시려면 해당 페이지의 「복합 단지 홈」을 눌러 주세요.",
    ],
    followUpReplies: [
      "B1은 마트·연결 통로 안내, 영화는 B2에서 엘리베이터 10F로 이어지는 동선 데모 문구가 있습니다. 숫자는 매일 한 번 고정되는 가짜 통계입니다.",
    ],
  },
  {
    id: "kiosk",
    keywords: ["키오스크", "kiosk", "?kiosk"],
    patterns: [/kiosk\s*=\s*1/],
    replies: [
      "주소 뒤에 ?kiosk=1 을 붙이시면 영화관 키오스크 전용 레이아웃이 열립니다. 일반 화면은 ?kiosk 없이 접속하시면 됩니다.",
    ],
  },
  {
    id: "cinema",
    keywords: [
      "영화",
      "시네마",
      "상영",
      "시간표",
      "예매",
      "포스터",
      "개봉",
      "좌석",
      "무비",
      "특별관",
      "돌비",
      "스크린x",
      "mx4d",
      "골드클래스",
      "리빙룸",
      "상영관",
    ],
    portalBonus: ["cinema"],
    replies: [
      "시네마 탭에서 무비차트로 작품을 고르신 뒤, 상영시간표에서 날짜·회차를 선택하시면 좌석 화면이 열립니다. 시간표 선택 목록은 상영 중인 작품만 예매 가능하도록 되어 있습니다.",
      "히어로에 보이는 작품과 시간표 기준이 다를 수 있습니다. 안내 문구가 나오시면 화면 안내를 따라가 주시면 됩니다.",
      "매점은 상단 메뉴와 예매 과정의 스낵 단계 양쪽에서 이용하실 수 있습니다.",
      "「상영시간표 · 예매」 안에 접어 두신 「상영관·특별관 안내」에서 돌비·스크린X·MX4D 등 8개 관의 설명을 펼쳐 보실 수 있습니다. 회차는 시간대별로 여러 개가 잡혀 있을 수 있습니다.",
    ],
    followUpReplies: [
      "별점과 추천 퍼센트는 데모용 수치입니다. 필터는 전체·상영중·개봉예정·종료와 연도 조합으로 조회하실 수 있습니다.",
      "복합 단지 상단 「빠른 이동」에서 무비차트·상영시간표·매점·예매내역으로 바로 점프하실 수 있습니다.",
    ],
  },
  {
    id: "snack",
    keywords: ["매점", "스낵", "팝콘", "콤보", "음료", "나초"],
    replies: [
      "시네마 매점 메뉴에서 메뉴를 확인하시거나, 예매 중 매점·스낵 담기 단계에서 수량을 조정하실 수 있습니다.",
    ],
  },
  {
    id: "concert",
    keywords: ["콘서트", "공연", "르세라핌", "lesserafim", "md", "응원봉", "티켓", "회차"],
    portalBonus: ["concert"],
    replies: [
      "콘서트 탭에서는 회차 선택 후 좌석, MD, 결제 순으로 진행하실 수 있습니다. 일부 좌석에는 프리미엄 구역 할증 데모가 적용됩니다.",
      "기대지수와 별점은 시연용 숫자이며, 실제 공연과는 무관한 가상 페이지입니다.",
    ],
    followUpReplies: [
      "예매 내역은 같은 탭 하단에서 확인하시거나, 데모용 전체 삭제도 가능합니다.",
    ],
  },
  {
    id: "mall",
    keywords: [
      "몰",
      "쇼핑",
      "마트",
      "식당",
      "층",
      "장바구니",
      "배송",
      "주문",
      "옷",
      "신발",
      "키즈",
      "아동",
      "유아",
      "전자",
      "가전",
      "디지털",
      "태블릿",
      "헤드폰",
      "사이즈",
      "여성",
      "남성",
      "벨트",
      "팔찌",
      "귀걸이",
      "가방",
    ],
    portalBonus: ["mall"],
    replies: [
      "세현몰은 층·카테고리·검색 패턴을 보여 주는 데모입니다. 장바구니에서 주문하기를 거쳐 관리자 결제까지가 한 세트 흐름입니다.",
      "시설 칩에서 9F 식당가, B1 마트 등을 누르시면 몰 탭과 층이 함께 열리도록 연결되어 있습니다.",
      "배송 관련 문구는 화면 시연용이며 실제 택배는 없습니다.",
      "6층에는 키즈 의류·완구·키즈용 전자(태블릿·헤드폰 등) 데모 상품이, 7층에는 일반 전자 코너가 있습니다. 의류·신발은 여성·남성·공용·키즈에 맞춰 사이즈 라벨이 나뉩니다.",
      "B1 세현마트는 데모 품목이 49종까지 늘어난 상태이며, 몰 상단에 이번 탭 접속 시각·직전 방문 시각이 표시됩니다.",
      "상단 「빠른 이동」에서 베스트·장바구니·Zoom·6F 키즈·7F 전자·시네마 메뉴 등으로 한 번에 옮겨 갈 수 있습니다.",
    ],
    followUpReplies: [
      "쇼핑몰 우측 하단 BGM은 클릭 한 번으로 재생되도록 되어 있습니다. 스트리밍이 되지 않을 경우 Web Audio로 대체됩니다.",
      "벨트는 허리(cm), 팔찌는 S/M/L처럼 액세서리마다 사이즈 표기가 다를 수 있습니다.",
    ],
  },
  {
    id: "bgm",
    keywords: ["bgm", "배경음", "음악", "재생", "소리", "플레이"],
    replies: [
      "세현몰 화면 오른쪽 아래 「쇼핑몰 BGM」에서 켜실 수 있습니다. 먼저 Web Audio로 재생이 시작되고, 네트워크가 되면 Mixkit 프리뷰로 전환될 수 있습니다.",
    ],
  },
  {
    id: "bug",
    keywords: ["버그", "오류", "에러", "broken", "안 열", "하얗", "빈화면", "안됨", "안돼", "안 돼"],
    replies: [
      "새로고침 후에도 문제가 있으시면 개발자 도구 콘솔에 오류가 있는지 확인해 보시기 바랍니다. 하위 경로에 배포하신 경우 Vite의 base 설정도 함께 확인해 주세요.",
      "데이터는 브라우저 localStorage에 저장됩니다. 시크릿 모드나 다른 브라우저에서는 초기화된 것처럼 보일 수 있습니다.",
    ],
  },
  {
    id: "what_is",
    keywords: ["뭐해", "뭘해", "능력", "뭐할수", "소개", "ai", "에이아이", "챗봇"],
    replies: [
      "저는 외부 API 없이 이 브라우저 안에서만 동작하는 로컬 안내입니다. 키워드와 패턴으로 의도를 추정하고, 직전 주제를 조금 기억합니다. 대형 언어 모델과는 다릅니다.",
      "규칙 기반 의도 추정과 여러 안내 문장 중 선택으로 답변을 드리고 있습니다. 자연스러운 대화가 되도록 정중히 말씀드리고자 합니다.",
    ],
  },
  {
    id: "cinema_rating",
    keywords: ["별점", "평점", "추천", "egg", "알"],
    portalBonus: ["cinema"],
    replies: [
      "포스터와 히어로 영역에 별점과 추천 퍼센트가 표시됩니다. 모두 데모용 숫자이며 실제 박스오피스와는 무관합니다.",
    ],
  },
];

/** 짧은 인사(「안녕」 등)는 후속 질문으로 오인하지 않도록 제외합니다. */
function looksLikeFollowUp(input: string): boolean {
  if (/^안녕/.test(input)) return false;
  if (/^(안뇽|헬로|hello|hi|헬로우|반가|하이|ㅎㅇ|굿모닝|yo)\s*$/i.test(input)) return false;
  if (/^좋은\s*(아침|저녁|밤|하루)/.test(input)) return false;
  if (input.length <= 1) return true;
  if (input.length === 2) {
    return /^(응|네|어|음|웅|읭|ㅇㅇ)$/.test(input);
  }
  return /^(그거|그건|그게|그걸|그것|자세히|더|더알려|왜|어떻게|그래서|그럼|음|어|네|응|ㅇㅇ)/.test(
    input
  );
}

type DayPart = "morning" | "afternoon" | "evening" | "night";

function clockPart(d: Date): DayPart {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 22) return "evening";
  return "night";
}

function dayPartFromInput(input: string, d: Date): DayPart {
  if (/아침|굿모닝|good\s*morning/.test(input)) return "morning";
  if (/점심/.test(input)) return "afternoon";
  if (/저녁|석식/.test(input)) return "evening";
  if (/늦은\s*밤|밤\s*늦|야간/.test(input)) return "night";
  return clockPart(d);
}

const TIME_OPEN: Record<DayPart, string[]> = {
  morning: [
    "🌅 좋은 아침입니다. 오늘도 편안하시길 바랍니다.",
    "☀️ 상쾌한 아침 인사 감사드립니다.",
    "🙂 아침부터 뵙게 되어 반갑습니다.",
    "✨ 오늘 아침도 찾아주셔서 감사합니다.",
  ],
  afternoon: [
    "🌤️ 안녕하세요, 오후도 무리 없이 보내시길 바랍니다.",
    "🍀 점심 이후에도 뵙게 되어 기쁩니다.",
    "💬 한낮에도 편히 말씀해 주셔서 감사합니다.",
  ],
  evening: [
    "🌆 좋은 저녁입니다. 편안한 시간 보내세요.",
    "🌙 저녁 시간에 인사해 주셔서 감사합니다.",
    "✨ 해 질 무렵에도 찾아주셔서 반갑습니다.",
  ],
  night: [
    "🌙 늦은 시간까지 뵙게 되어 감사합니다.",
    "💤 밤늦게도 인사해 주셔서 고맙습니다.",
    "🌟 야간에도 편히 이용해 주셔서 감사합니다.",
  ],
};

const PORTAL_WELCOME: Record<ChatbotPortal, string[]> = {
  mall: [
    "🛍️ 지금은 세현몰 탭이시니, 층별 쇼핑·식당가·마트 동선을 차분히 안내해 드릴 수 있습니다.",
    "🛒 쇼핑과 장바구니, 관리자 결제 흐름을 짚어 드리기 좋은 화면입니다.",
    "🎵 원하시면 BGM이나 상단 빠른 이동·시설 칩으로 바로 점프하는 방법도 말씀드리겠습니다.",
  ],
  cinema: [
    "🎬 지금은 세현 시네마 탭이시니, 무비차트·상영시간표·매점·예매를 안내해 드리기 좋습니다.",
    "🍿 상영 중 작품 기준으로 시간표가 잡혀 있을 수 있어, 안내 문구를 함께 보시면 편합니다.",
    "✨ 특별관 설명은 시간표 구역의 안내를 펼쳐 보시면 됩니다.",
    "🖥️ 키오스크 전용 화면이 필요하시면 주소에 ?kiosk=1 을 붙이는 방법도 알려 드립니다.",
  ],
  concert: [
    "🎤 지금은 콘서트 탭이시니, 회차·좌석·MD·결제 순서를 정중히 안내해 드릴 수 있습니다.",
    "⭐ 기대지수와 별점은 데모 수치라는 점도 함께 말씀드릴 수 있습니다.",
    "🎫 예매 내역 확인과 데모 삭제 방법도 여쭤 보시면 됩니다.",
  ],
};

const GREET_INVITE = [
  "💬 주차, 예매, 결제, 콘서트처럼 한 가지씩만 말씀해 주셔도 충분합니다.",
  "✨ 편하실 때 키워드만 던져 주셔도 제가 이어서 안내해 드리겠습니다.",
  "👉 이어서 「그거 자세히」처럼 짧게 말씀해 주셔도 됩니다.",
  "🎯 영화·쇼핑·공연 중 어디를 먼저 보실지 정하신 뒤 말씀해 주시면 감사하겠습니다.",
];

function buildGreetingReply(input: string, portal: ChatbotPortal, ctx: BrainContext): string {
  const part = dayPartFromInput(input, new Date());
  const timeLine = pick(TIME_OPEN[part]);
  const portalLine = pick(PORTAL_WELCOME[portal]);
  const invite = pick(GREET_INVITE);

  if (ctx.greetExchangeCount === 0) {
    return `${timeLine}\n${portalLine}\n${invite}`;
  }

  const again = pick([
    "🙌 다시 인사해 주셔서 고맙습니다.",
    "😊 또 뵙게 되어 반갑습니다.",
    "✨ 인사를 이어 주셔서 감사합니다.",
    "💛 자주 뵙게 되니 저도 기쁩니다.",
  ]);
  const extra = pick([
    "💬 이어서 궁금하신 키워드를 말씀해 주시면 안내해 드리겠습니다.",
    "🎯 같은 주제를 더 물으시거나 다른 메뉴로 넘어가셔도 좋습니다.",
    "🚗 주차·예매·결제·콘서트 중 편한 말씀을 덧붙여 주시면 감사하겠습니다.",
  ]);

  return `${again}\n${timeLine}\n${portalLine}\n${extra}`;
}

function scoreIntent(text: string, intent: IntentDef, portal: ChatbotPortal): number {
  let score = 0;
  for (const k of intent.keywords) {
    if (k.length >= 1 && text.includes(k)) score += k.length >= 3 ? 2 : 1;
  }
  if (intent.patterns) {
    for (const p of intent.patterns) {
      if (p.test(text)) score += 3;
    }
  }
  if (intent.portalBonus?.includes(portal)) score += 1;
  return score;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function localAiReply(
  rawInput: string,
  portal: ChatbotPortal,
  ctx: BrainContext
): { text: string; intentId: string | null; bumpGreetCount: boolean } {
  const input = normalize(rawInput);
  if (!input) {
    return {
      text: "🙂 편히 말씀해 주세요. 주차, 예매, 결제, 콘서트처럼 한 가지씩 적어 주시면 감사하겠습니다.",
      intentId: null,
      bumpGreetCount: false,
    };
  }

  if (containsDisrespectfulLanguage(input)) {
    return {
      text:
        "불쾌하실 수 있는 표현은 삼가 주시면 감사하겠습니다. 저는 세현 복합 단지 안내만 정중히 도와드릴 수 있습니다. 주차, 예매, 결제, 콘서트 등 궁금하신 점을 말씀해 주시겠어요?",
      intentId: null,
      bumpGreetCount: false,
    };
  }

  let best: { id: string; score: number; def: IntentDef } | null = null;
  for (const def of INTENTS) {
    const sc = scoreIntent(input, def, portal);
    if (sc <= 0) continue;
    if (!best || sc > best.score) best = { id: def.id, score: sc, def };
    else if (best && sc === best.score) {
      if (def.keywords.length > best.def.keywords.length) best = { id: def.id, score: sc, def };
    }
  }

  const vague = looksLikeFollowUp(input);
  if (vague && ctx.lastIntentId) {
    const prev = INTENTS.find((i) => i.id === ctx.lastIntentId);
    if (prev?.followUpReplies?.length) {
      return {
        text: pick(prev.followUpReplies),
        intentId: prev.id,
        bumpGreetCount: false,
      };
    }
    const prevDef = INTENTS.find((i) => i.id === ctx.lastIntentId);
    if (prevDef?.replies.length) {
      return {
        text: `직전에 말씀하신 내용을 이어서 안내해 드리겠습니다.\n${pick(prevDef.replies)}`,
        intentId: prevDef.id,
        bumpGreetCount: false,
      };
    }
  }

  if (!best || best.score < 2) {
    const hint =
      portal === "mall"
        ? "지금은 세현몰 탭입니다. 층·키즈·전자, 장바구니, BGM, 관리자 결제 등의 말씀을 덧붙여 주시면 감사하겠습니다."
        : portal === "cinema"
          ? "지금은 시네마 탭입니다. 시간표, 특별관, 매점, 개봉예정, 좌석 등의 키워드를 넣어 주시면 도움이 됩니다."
          : "지금은 콘서트 탭입니다. 회차, MD, 좌석, 결제에 대해 여쭤 주시면 안내해 드리겠습니다.";
    return {
      text: `죄송합니다만, 질문을 충분히 이해하지 못했습니다. ${hint}\n로컬 안내 특성상 짧은 키워드로 다시 말씀해 주시면 감사하겠습니다.`,
      intentId: best?.id ?? null,
      bumpGreetCount: false,
    };
  }

  if (best.id === "farewell") {
    return { text: pick(best.def.replies), intentId: "farewell", bumpGreetCount: false };
  }

  if (best.id === "greet") {
    return {
      text: buildGreetingReply(input, portal, ctx),
      intentId: "greet",
      bumpGreetCount: true,
    };
  }

  const pool =
    best.score >= 4 && best.def.followUpReplies?.length
      ? [...best.def.replies, ...best.def.followUpReplies]
      : best.def.replies;

  let text = pick(pool);

  if (best.id !== "greet" && best.id !== "farewell" && ctx.turnIndex > 0 && Math.random() < 0.35) {
    const fillers = [
      "말씀을 정리해 보면, ",
      "안내 드리는 데모 기준으로는 ",
      "이 사이트 설정상 ",
      "제가 도와드릴 수 있는 범위에서는 ",
    ];
    text = `${pick(fillers)}${text}`;
  }

  return { text, intentId: best.id, bumpGreetCount: false };
}

export function typingDelayMs(replyLength: number): number {
  const base = 320 + Math.min(900, replyLength * 12);
  return base + Math.floor(Math.random() * 220);
}
