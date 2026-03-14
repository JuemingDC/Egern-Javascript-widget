export default async function (ctx) {
  /* =========================================================
     ENVIRONMENT VARIABLES
     ========================================================= */

  // API base URL
  const API_BASE = ctx.env.API_BASE || "https://api.frankfurter.dev/v1";

  // Base currency
  const BASE = (ctx.env.BASE_CURRENCY || "CNY").toUpperCase();

  // Target currencies
  const SYMBOLS = (ctx.env.SYMBOLS || "USD,EUR,JPY,KRW,GBP,HKD,AUD,TRY")
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);

  // Tap widget → open page
  const OPEN_URL = ctx.env.OPEN_URL || "https://frankfurter.dev/";

  // Title text
  const TITLE = ctx.env.TITLE || "实时汇率";



  /* =========================================================
     DESIGN SYSTEM
     Clean dark dual-gradient background
     Chosen for high contrast and stable readability
     ========================================================= */

  const palette = {
    bgTop: "#111827",
    bgBottom: "#1E293B",

    card: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(255,255,255,0.08)",

    title: "#F8FAFC",
    primary: "#E5E7EB",
    secondary: "#94A3B8",
    faint: "rgba(148,163,184,0.72)",

    up: "#4ADE80",
    down: "#FB7185",
    flat: "#CBD5E1"
  };



  /* =========================================================
     LABELS
     ========================================================= */

  const currencyNames = {
    USD: "美元",
    EUR: "欧元",
    JPY: "日元",
    KRW: "韩元",
    GBP: "英镑",
    HKD: "港币",
    AUD: "澳元",
    TRY: "里拉"
  };



  /* =========================================================
     HELPERS
     ========================================================= */

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateISO(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function formatRate(code, value) {
    if (value == null) return "--";

    if (code === "JPY" || code === "KRW") return value.toFixed(2);
    return value.toFixed(4);
  }

  function percentChange(curr, prev) {
    if (curr == null || prev == null || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }

  function movementMeta(delta) {
    if (delta == null) {
      return {
        arrow: "→",
        color: palette.flat,
        text: "--"
      };
    }

    if (delta > 0) {
      return {
        arrow: "↑",
        color: palette.up,
        text: `${delta.toFixed(2)}%`
      };
    }

    if (delta < 0) {
      return {
        arrow: "↓",
        color: palette.down,
        text: `${Math.abs(delta).toFixed(2)}%`
      };
    }

    return {
      arrow: "→",
      color: palette.flat,
      text: "0.00%"
    };
  }



  /* =========================================================
     FETCH FX DATA
     Use last 7 days and compare latest two available workdays
     ========================================================= */

  async function fetchSeries() {
    const startDate = formatDateISO(daysAgo(7));
    const url =
      `${API_BASE}/${startDate}..?base=${encodeURIComponent(BASE)}&symbols=${encodeURIComponent(SYMBOLS.join(","))}`;

    const resp = await ctx.http.get(url, {
      timeout: 12000,
      redirect: "follow"
    });

    return await resp.json();
  }

  let data = null;
  let error = null;

  try {
    data = await fetchSeries();
  } catch (e) {
    error = String(e && e.message ? e.message : e);
  }



  /* =========================================================
     FALLBACK UI
     ========================================================= */

  if (!data || !data.rates || error) {
    return {
      type: "widget",
      url: OPEN_URL,
      padding: 16,
      gap: 10,
      backgroundGradient: {
        type: "linear",
        colors: [palette.bgTop, palette.bgBottom],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: "text",
          text: TITLE,
          font: { size: "body", weight: "bold" },
          textColor: palette.title,
          textAlign: "center",
          maxLines: 1
        },
        {
          type: "text",
          text: "汇率数据暂不可用",
          font: { size: "body", weight: "semibold" },
          textColor: palette.secondary,
          textAlign: "center",
          maxLines: 1
        }
      ],
      refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
  }



  /* =========================================================
     PREPARE DATA
     ========================================================= */

  const rateMap = data.rates || {};
  const availableDates = Object.keys(rateMap).sort();

  const latestDate = availableDates[availableDates.length - 1];
  const prevDate = availableDates[availableDates.length - 2] || latestDate;

  const latestRates = rateMap[latestDate] || {};
  const prevRates = rateMap[prevDate] || {};

  const items = SYMBOLS.map(code => {
    const curr = safeNum(latestRates[code]);
    const prev = safeNum(prevRates[code]);
    const delta = percentChange(curr, prev);
    const mv = movementMeta(delta);

    return {
      code,
      name: currencyNames[code] || code,
      rateText: formatRate(code, curr),
      moveText: mv.text,
      arrow: mv.arrow,
      color: mv.color
    };
  });



  /* =========================================================
     UI COMPONENTS
     One row item:
     left  = code + Chinese name
     right = rate + movement
     ========================================================= */

  function fxRow(item) {
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      padding: [8, 10, 8, 10],
      backgroundColor: palette.card,
      borderRadius: 12,
      children: [
        {
          type: "stack",
          flex: 1,
          gap: 2,
          children: [
            {
              type: "text",
              text: item.code,
              font: { size: "caption1", weight: "bold", family: "Menlo" },
              textColor: palette.secondary,
              maxLines: 1
            },
            {
              type: "text",
              text: item.name,
              font: { size: "body", weight: "bold" },
              textColor: palette.primary,
              maxLines: 1,
              minScale: 0.8
            }
          ]
        },
        {
          type: "stack",
          gap: 2,
          children: [
            {
              type: "text",
              text: item.rateText,
              font: { size: "body", weight: "bold", family: "Menlo" },
              textColor: item.color,
              textAlign: "right",
              maxLines: 1,
              minScale: 0.7
            },
            {
              type: "text",
              text: `${item.arrow} ${item.moveText}`,
              font: { size: "caption2", weight: "bold", family: "Menlo" },
              textColor: item.color,
              textAlign: "right",
              maxLines: 1,
              minScale: 0.7
            }
          ]
        }
      ]
    };
  }

  function row2(a, b) {
    return {
      type: "stack",
      direction: "row",
      gap: 10,
      children: [
        {
          type: "stack",
          flex: 1,
          children: [fxRow(a)]
        },
        {
          type: "stack",
          flex: 1,
          children: [fxRow(b)]
        }
      ]
    };
  }



  /* =========================================================
     ACCESSORY INLINE
     ========================================================= */

  if (ctx.widgetFamily === "accessoryInline") {
    const top = items[0];
    return {
      type: "widget",
      url: OPEN_URL,
      children: [
        {
          type: "text",
          text: `${top.code} ${top.rateText} ${top.arrow}${top.moveText}`,
          font: { size: "caption2", weight: "semibold", family: "Menlo" },
          textColor: top.color,
          maxLines: 1,
          minScale: 0.6
        }
      ]
    };
  }



  /* =========================================================
     ACCESSORY RECTANGULAR
     Minimal and clean
     ========================================================= */

  if (ctx.widgetFamily === "accessoryRectangular") {
    const top = items.slice(0, 3);

    return {
      type: "widget",
      url: OPEN_URL,
      padding: 10,
      gap: 6,
      backgroundGradient: {
        type: "linear",
        colors: [palette.bgTop, palette.bgBottom],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: "text",
          text: TITLE,
          font: { size: "caption1", weight: "bold" },
          textColor: palette.title,
          textAlign: "center",
          maxLines: 1
        },
        ...top.map(item => ({
          type: "stack",
          direction: "row",
          children: [
            {
              type: "text",
              text: `${item.code} ${item.rateText}`,
              font: { size: "caption2", weight: "bold", family: "Menlo" },
              textColor: palette.primary,
              maxLines: 1,
              minScale: 0.65
            },
            { type: "spacer" },
            {
              type: "text",
              text: `${item.arrow} ${item.moveText}`,
              font: { size: "caption2", weight: "bold", family: "Menlo" },
              textColor: item.color,
              maxLines: 1,
              minScale: 0.65
            }
          ]
        }))
      ],
      refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
  }



  /* =========================================================
     SYSTEM SMALL
     Show 4 currencies only
     ========================================================= */

  if (ctx.widgetFamily === "systemSmall") {
    const smallItems = items.slice(0, 4);

    return {
      type: "widget",
      url: OPEN_URL,
      padding: 14,
      gap: 8,
      backgroundGradient: {
        type: "linear",
        colors: [palette.bgTop, palette.bgBottom],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: "text",
          text: TITLE,
          font: { size: "body", weight: "bold" },
          textColor: palette.title,
          textAlign: "center",
          maxLines: 1
        },
        row2(smallItems[0], smallItems[1]),
        row2(smallItems[2], smallItems[3])
      ],
      refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
  }



  /* =========================================================
     SYSTEM MEDIUM / DEFAULT
     Clean layout:
     - small centered title
     - 4 rows × 2 columns
     - no unrelated information
     ========================================================= */

  return {
    type: "widget",
    url: OPEN_URL,
    padding: 16,
    gap: 10,
    backgroundGradient: {
      type: "linear",
      colors: [palette.bgTop, palette.bgBottom],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "text",
        text: TITLE,
        font: { size: "body", weight: "bold" },
        textColor: palette.title,
        textAlign: "center",
        maxLines: 1
      },

      row2(items[0], items[1]),
      row2(items[2], items[3]),
      row2(items[4], items[5]),
      row2(items[6], items[7])
    ],
    refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };
}
