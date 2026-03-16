// 多目标日倒计时小组件（液态玻璃夜空版）
//
// 设计：
// 1. 保留原有环境变量与数据逻辑
// 2. 夜空风格双色渐变 + 轻液态玻璃感
// 3. 去除厚重框感，仅保留轻微层次与发光分隔
// 4. 内容不挤满整个组件，自动根据条目数调整字号与间距
// 5. 多目标时自动收缩标题/明细/天数字号，保证布局稳定
//
// 环境变量：
//   TITLE         - 组件标题，默认 "倒计时"
//   TZ_OFFSET     - 时区，默认 "+08:00"
//   MAX_ITEMS     - 最多显示几个目标，默认 3，最大 4
//   REFRESH_MIN   - 刷新间隔（分钟），默认 30
//
//   NAME1         - 目标 1 名称
//   DATE1         - 目标 1 日期，ISO 8601，如 2026-03-19T23:59:59+08:00
//   DETAIL1       - 目标 1 说明
//
//   NAME2 / DATE2 / DETAIL2
//   NAME3 / DATE3 / DETAIL3
//   NAME4 / DATE4 / DETAIL4
//   NAME5 / DATE5 / DETAIL5
//   NAME6 / DATE6 / DETAIL6

export default async function (ctx) {
  const TITLE = (ctx.env.TITLE || "倒计时").trim();
  const TZ_OFFSET = (ctx.env.TZ_OFFSET || "+08:00").trim();
  const MAX_ITEMS = clampInt(ctx.env.MAX_ITEMS, 3, 1, 4);
  const REFRESH_MIN = clampInt(ctx.env.REFRESH_MIN, 30, 5, 180);

  const items = collectItems(ctx.env, TZ_OFFSET).slice(0, MAX_ITEMS);

  if (!items.length) {
    return errorWidget("请至少配置一组 NAME1 / DATE1 / DETAIL1。");
  }

  const metrics = computeLayoutMetrics(items);

  if (ctx.widgetFamily === "accessoryInline") {
    const first = items[0];
    return {
      type: "widget",
      refreshAfter: nextRefreshISO(REFRESH_MIN),
      children: [
        {
          type: "text",
          text: `${first.name} · ${first.done ? "已到" : `还剩 ${first.days} 天`}`,
          font: { size: "caption2", weight: "medium" },
          textColor: color("#0F172A", "#F8FAFC"),
          maxLines: 1,
        },
      ],
    };
  }

  if (ctx.widgetFamily === "accessoryCircular") {
    const first = items[0];
    return {
      type: "widget",
      refreshAfter: nextRefreshISO(REFRESH_MIN),
      padding: 8,
      backgroundGradient: bgGradient(),
      children: [buildMiniDays(first, metrics)],
    };
  }

  if (ctx.widgetFamily === "accessoryRectangular") {
    const first = items[0];
    return {
      type: "widget",
      refreshAfter: nextRefreshISO(REFRESH_MIN),
      padding: 10,
      gap: 6,
      backgroundGradient: bgGradient(),
      children: [
        buildHeader(TITLE, items.length, 11),
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: 10,
          children: [
            {
              type: "stack",
              flex: 1,
              direction: "column",
              gap: 2,
              children: [
                {
                  type: "text",
                  text: first.name,
                  font: { size: Math.max(12, metrics.nameSize - 1), weight: "bold" },
                  textColor: "#F4F8FF",
                  maxLines: 1,
                  minScale: 0.72,
                },
                {
                  type: "text",
                  text: first.detail || " ",
                  font: { size: "caption2", weight: "medium" },
                  textColor: "rgba(201,214,235,0.72)",
                  maxLines: 1,
                  minScale: 0.75,
                },
              ],
            },
            buildMiniDays(first, metrics),
          ],
        },
      ],
    };
  }

  return {
    type: "widget",
    refreshAfter: nextRefreshISO(REFRESH_MIN),
    padding: metrics.widgetPadding,
    gap: metrics.mainGap,
    backgroundGradient: bgGradient(),
    children: [
      buildHeader(TITLE, items.length, metrics.headerIconSize),
      {
        type: "stack",
        direction: "column",
        gap: metrics.rowGap,
        children: items.map((item, index) =>
          buildItemRow(item, index, items.length, metrics)
        ),
      },
    ],
  };
}

function buildHeader(title, count, iconSize) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    padding: [0, 0, 1, 0],
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "image",
            src: "sf-symbol:calendar.badge.clock",
            width: iconSize,
            height: iconSize,
            color: "rgba(186,220,255,0.76)",
          },
          {
            type: "text",
            text: title,
            font: { size: "caption1", weight: "semibold" },
            textColor: "rgba(235,243,255,0.74)",
            maxLines: 1,
          },
        ],
      },
      { type: "spacer" },
      {
        type: "text",
        text: `${count} 项`,
        font: { size: "caption2", weight: "medium" },
        textColor: "rgba(160,179,205,0.72)",
        maxLines: 1,
      },
    ],
  };
}

function buildItemRow(item, index, total, metrics) {
  const isLast = index === total - 1;

  return {
    type: "stack",
    direction: "column",
    gap: metrics.separatorGap,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: metrics.sideGap,
        children: [
          {
            type: "stack",
            flex: 1,
            direction: "column",
            gap: metrics.textGap,
            children: [
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 7,
                children: [
                  {
                    type: "stack",
                    width: metrics.dotSize,
                    height: metrics.dotSize,
                    backgroundColor: item.dayColor,
                    borderRadius: "auto",
                    shadowColor: withAlpha(item.dayColor, 0.22),
                    shadowRadius: 5,
                    children: [],
                  },
                  {
                    type: "text",
                    text: item.name,
                    font: { size: metrics.nameSize, weight: "bold" },
                    textColor: "#F4F8FF",
                    maxLines: 1,
                    minScale: 0.72,
                    flex: 1,
                  },
                ],
              },
              {
                type: "stack",
                direction: "row",
                alignItems: "center",
                gap: 7,
                children: [
                  {
                    type: "stack",
                    width: metrics.dotSize,
                    height: metrics.dotSize,
                    children: [],
                  },
                  {
                    type: "text",
                    text: item.detail || " ",
                    font: { size: metrics.detailSize, weight: "medium" },
                    textColor: "rgba(188,203,225,0.78)",
                    maxLines: metrics.detailLines,
                    minScale: 0.76,
                    flex: 1,
                  },
                ],
              },
            ],
          },

          buildDaysCluster(item, metrics),
        ],
      },

      ...(isLast
        ? []
        : [
            {
              type: "stack",
              direction: "row",
              height: 1,
              backgroundGradient: separatorGradient(),
              borderRadius: 99,
              children: [],
            },
          ]),
    ],
  };
}

function buildDaysCluster(item, metrics) {
  return {
    type: "stack",
    width: metrics.daysWidth,
    height: metrics.daysHeight,
    direction: "column",
    alignItems: "center",
    justifyContent: "center",
    children: [
      {
        type: "text",
        text: String(item.days),
        font: { size: metrics.daysSize, weight: "bold" },
        textColor: item.dayColor,
        shadowColor: withAlpha(item.dayColor, 0.14),
        shadowRadius: 8,
        maxLines: 1,
      },
      {
        type: "text",
        text: item.done ? "DONE" : "DAYS",
        font: { size: metrics.daysLabelSize, weight: "semibold" },
        textColor: "rgba(170,188,212,0.82)",
        maxLines: 1,
      },
    ],
  };
}

function buildMiniDays(item, metrics) {
  return {
    type: "stack",
    width: 42,
    height: 42,
    direction: "column",
    alignItems: "center",
    justifyContent: "center",
    children: [
      {
        type: "text",
        text: String(item.days),
        font: { size: Math.max(17, metrics.daysSize - 6), weight: "bold" },
        textColor: item.dayColor,
        maxLines: 1,
      },
    ],
  };
}

function computeLayoutMetrics(items) {
  const count = items.length;
  const maxNameLen = Math.max(...items.map((x) => visualLength(x.name)));
  const maxDetailLen = Math.max(...items.map((x) => visualLength(x.detail || "")));

  let nameSize;
  if (count <= 2) nameSize = 17;
  else if (count === 3) nameSize = 16;
  else nameSize = 15;

  if (maxNameLen > 20) nameSize -= 2;
  else if (maxNameLen > 16) nameSize -= 1;

  const detailSize = count >= 4 || maxDetailLen > 16 ? "caption2" : "caption1";

  return {
    widgetPadding: count >= 4 ? [16, 16, 14, 16] : [18, 18, 16, 18],
    mainGap: count >= 4 ? 10 : 12,
    rowGap: count >= 4 ? 8 : 10,
    separatorGap: count >= 4 ? 7 : 8,
    sideGap: count >= 4 ? 10 : 12,
    textGap: count >= 4 ? 3 : 4,
    dotSize: count >= 4 ? 4 : 5,
    headerIconSize: count >= 4 ? 11 : 12,
    nameSize: Math.max(12, nameSize),
    detailSize,
    detailLines: count >= 4 ? 1 : 2,
    daysWidth: count >= 4 ? 52 : 58,
    daysHeight: count >= 4 ? 50 : 58,
    daysSize: count >= 4 ? 23 : 26,
    daysLabelSize: count >= 4 ? "caption2" : "caption2",
  };
}

function collectItems(env, tzOffset) {
  const out = [];
  const now = currentDateByOffset(tzOffset);

  for (let i = 1; i <= 6; i++) {
    const name = String(env[`NAME${i}`] || "").trim();
    const dateRaw = String(env[`DATE${i}`] || "").trim();
    const detail = String(env[`DETAIL${i}`] || "").trim();

    if (!name || !dateRaw) continue;

    const target = new Date(dateRaw);
    if (Number.isNaN(target.getTime())) continue;

    const remainMs = target.getTime() - now.getTime();
    const days = remainMs <= 0 ? 0 : Math.ceil(remainMs / 86400000);
    const done = remainMs <= 0;

    out.push({
      name,
      detail,
      target,
      days,
      done,
      dayColor: urgencyColor(days, done),
    });
  }

  out.sort((a, b) => a.target.getTime() - b.target.getTime());
  return out;
}

function visualLength(text) {
  let len = 0;
  for (const ch of String(text || "")) {
    len += /[ -~]/.test(ch) ? 0.55 : 1;
  }
  return len;
}

function urgencyColor(days, done) {
  if (done) return "#A8B7CC";
  if (days <= 3) return "#FB7185";
  if (days <= 7) return "#FB923C";
  if (days <= 15) return "#FBBF24";
  return "#4ADE80";
}

function bgGradient() {
  return {
    type: "linear",
    colors: ["#07101A", "#0A1730", "#111D3F", "#1A2550"],
    stops: [0, 0.34, 0.7, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function separatorGradient() {
  return {
    type: "linear",
    colors: [
      "rgba(255,255,255,0)",
      "rgba(170,202,255,0.14)",
      "rgba(255,255,255,0)"
    ],
    stops: [0, 0.5, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 0 },
  };
}

function withAlpha(hex, alpha) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function currentDateByOffset(offset) {
  const minutes = parseOffsetToMinutes(offset);
  const now = new Date();
  return new Date(now.getTime() + (minutes + now.getTimezoneOffset()) * 60000);
}

function parseOffsetToMinutes(offset) {
  const m = String(offset).trim().match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!m) return 8 * 60;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function nextRefreshISO(minutes) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

function clampInt(v, fallback, min, max) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function color(light, dark) {
  return { light, dark };
}

function errorWidget(message) {
  return {
    type: "widget",
    padding: 16,
    backgroundGradient: {
      type: "linear",
      colors: ["#281414", "#351919", "#402020"],
      stops: [0, 0.55, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    children: [
      {
        type: "text",
        text: "倒计时组件",
        font: { size: "headline", weight: "bold" },
        textColor: "#FFFFFF",
      },
      {
        type: "text",
        text: message,
        font: { size: "caption1", weight: "medium" },
        textColor: "#FFB4A2",
        maxLines: 2,
      },
    ],
  };
}
