export default async function (ctx) {
  /* =========================================================
     ENVIRONMENT VARIABLES
     ========================================================= */

  // API base URL
  const API_BASE = ctx.env.API_BASE || "https://api.frankfurter.dev/v1";

  // Base currency, requested as CNY
  const BASE = (ctx.env.BASE_CURRENCY || "CNY").toUpperCase();

  // Target currencies, exactly 8 by default
  const SYMBOLS = (ctx.env.SYMBOLS || "USD,EUR,JPY,KRW,GBP,HKD,AUD,TRY")
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);

  // Tap widget to open details page
  const OPEN_URL = ctx.env.OPEN_URL || "https://frankfurter.dev/";

  // Widget title
  const TITLE = ctx.env.TITLE || "实时汇率";



  /* =========================================================
     DESIGN SYSTEM
     Carefully selected dark dual-gradient background:
     - deep blue-gray
     - muted indigo
     This keeps light text readable and up/down colors distinct.
     ========================================================= */

  const palette = {
    bgTop: "#0E1421",
    bgBottom: "#1A2040",
    card: "rgba(255,255,255,0.06)",
    lineDim: "rgba(255,255,255,0.14)",
    lineLive: "rgba(132, 176, 255, 0.72)",
    title: "#F7F9FC",
    primary: "#E9EEF8",
    secondary: "#A7B2C8",
    faint: "rgba(167,178,200,0.50)",
    time: "#DCE7FF",
    up: "#63D297",
    down: "#FF8D8D",
    flat: "#C7CFDC"
  };



  /* =========================================================
     LABELS
     Currency display names
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

  function formatClock(date) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
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

    // Small currency values usually need more decimals
    if (code === "JPY" || code === "KRW") return value.toFixed(2);
    if (code === "TRY") return value.toFixed(4);
    return value.toFixed(4);
  }

  function percentChange(curr, prev) {
    if (curr == null || prev == null || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }

  function movementMeta(delta) {
    if (delta == null) {
      return {
        arrow: "•",
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
     TIME / DAY PROGRESS
     Divider concept:
     - center: only current time
     - left: elapsed part dimmed
     - right: remaining part brighter / stronger
     ========================================================= */

  const now = new Date();
  const currentTime = formatClock(now);

  const secondsPassed =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();

  const secondsInDay = 86400;
  const secondsRemaining = Math.max(0, secondsInDay - secondsPassed);

  const passedRatio = Math.max(0.05, secondsPassed / secondsInDay);
  const remainRatio = Math.max(0.05, secondsRemaining / secondsInDay);

  const remainText = `${pad2(Math.floor(secondsRemaining / 3600))}:${pad2(Math.floor((secondsRemaining % 3600) / 60))}:${pad2(secondsRemaining % 60)}`;



  /* =========================================================
     FETCH FX DATA
     Strategy:
     - query recent time series from 7 days ago to today
     - use latest two available working-day snapshots
     - base = CNY
     - symbols = selected target currencies
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
          font: { size: "headline", weight: "bold" },
          textColor: palette.title,
          textAlign: "center",
          maxLines: 1
        },
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "stack",
              flex: passedRatio,
              height: 2,
              backgroundColor: palette.lineDim,
              borderRadius: 999
            },
            { type: "spacer", length: 8 },
            {
              type: "text",
              text: currentTime,
              font: { size: "caption1", weight: "bold", family: "Menlo" },
              textColor: palette.time,
              maxLines: 1
            },
            { type: "spacer", length: 8 },
            {
              type: "stack",
              flex: remainRatio,
              height: 3,
              backgroundColor: palette.lineLive,
              borderRadius: 999
            }
          ]
        },
        {
          type: "text",
          text: `今日剩余 ${remainText}`,
          font: { size: "caption1", weight: "bold", family: "Menlo" },
          textColor: palette.primary,
          textAlign: "right",
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
      refreshAfter: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  }



  /* =========================================================
     PREPARE DATA
     Use latest two available working-day points
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
     ========================================================= */

  function fxCell(item) {
    return {
      type: "stack",
      flex: 1,
      padding: [8, 10, 8, 10],
      gap: 3,
      backgroundColor: palette.card,
      borderRadius: 14,
      children: [
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "text",
              text: item.code,
              font: { size: "caption1", weight: "bold", family: "Menlo" },
              textColor: palette.secondary,
              maxLines: 1
            },
            { type: "spacer" },
            {
              type: "text",
              text: `${item.arrow} ${item.moveText}`,
              font: { size: "caption2", weight: "bold", family: "Menlo" },
              textColor: item.color,
              maxLines: 1,
              minScale: 0.7
            }
          ]
        },
        {
          type: "text",
          text: item.name,
          font: { size: "body", weight: "bold" },
          textColor: palette.primary,
          maxLines: 1,
          minScale: 0.8
        },
        {
          type: "text",
          text: item.rateText,
          font: { size: "title3", weight: "bold", family: "Menlo" },
          textColor: item.color,
          maxLines: 1,
          minScale: 0.7
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
        fxCell(a),
        fxCell(b)
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
          text: `${TITLE} ${top.code} ${top.arrow}${top.moveText}`,
          font: { size: "caption2", weight: "semibold" },
          textColor: top.color,
          maxLines: 1,
          minScale: 0.6
        }
      ]
    };
  }



  /* =========================================================
     ACCESSORY RECTANGULAR
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
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "stack",
              flex: passedRatio,
              height: 2,
              backgroundColor: palette.lineDim,
              borderRadius: 999
            },
            { type: "spacer", length: 6 },
            {
              type: "text",
              text: currentTime,
              font: { size: "caption2", weight: "bold", family: "Menlo" },
              textColor: palette.time,
              maxLines: 1
            },
            { type: "spacer", length: 6 },
            {
              type: "stack",
              flex: remainRatio,
              height: 3,
              backgroundColor: palette.lineLive,
              borderRadius: 999
            }
          ]
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
     Compact 4 currencies
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
          font: { size: "headline", weight: "bold" },
          textColor: palette.title,
          textAlign: "center",
          maxLines: 1
        },
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "stack",
              flex: passedRatio,
              height: 2,
              backgroundColor: palette.lineDim,
              borderRadius: 999
            },
            { type: "spacer", length: 6 },
            {
              type: "text",
              text: currentTime,
              font: { size: "caption2", weight: "bold", family: "Menlo" },
              textColor: palette.time,
              maxLines: 1
            },
            { type: "spacer", length: 6 },
            {
              type: "stack",
              flex: remainRatio,
              height: 3,
              backgroundColor: palette.lineLive,
              borderRadius: 999
            }
          ]
        },
        {
          type: "text",
          text: `今日剩余 ${remainText}`,
          font: { size: "caption2", weight: "bold", family: "Menlo" },
          textColor: palette.primary,
          textAlign: "right",
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
     Main layout:
     - centered title
     - time divider
     - right-aligned remaining day countdown
     - 4 rows × 2 columns = 8 currencies
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
        font: { size: "title3", weight: "bold" },
        textColor: palette.title,
        textAlign: "center",
        maxLines: 1
      },

      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "stack",
            flex: passedRatio,
            height: 2,
            backgroundColor: palette.lineDim,
            borderRadius: 999
          },
          { type: "spacer", length: 8 },
          {
            type: "text",
            text: currentTime,
            font: { size: "caption1", weight: "bold", family: "Menlo" },
            textColor: palette.time,
            maxLines: 1
          },
          { type: "spacer", length: 8 },
          {
            type: "stack",
            flex: remainRatio,
            height: 3,
            backgroundColor: palette.lineLive,
            borderRadius: 999
          }
        ]
      },

      {
        type: "stack",
        direction: "row",
        children: [
          {
            type: "text",
            text: `基准 ${BASE}`,
            font: { size: "caption2", weight: "medium", family: "Menlo" },
            textColor: palette.faint,
            maxLines: 1
          },
          { type: "spacer" },
          {
            type: "text",
            text: `今日剩余 ${remainText}`,
            font: { size: "caption1", weight: "bold", family: "Menlo" },
            textColor: palette.primary,
            maxLines: 1,
            minScale: 0.7
          }
        ]
      },

      row2(items[0], items[1]),
      row2(items[2], items[3]),
      row2(items[4], items[5]),
      row2(items[6], items[7]),

      {
        type: "stack",
        direction: "row",
        children: [
          {
            type: "text",
            text: latestDate || "--",
            font: { size: "caption2", weight: "medium", family: "Menlo" },
            textColor: palette.faint,
            maxLines: 1
          },
          { type: "spacer" },
          {
            type: "text",
            text: "Rates by Frankfurter",
            font: { size: "caption2", weight: "medium" },
            textColor: palette.faint,
            maxLines: 1
          }
        ]
      }
    ],
    refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };
}