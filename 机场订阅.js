// 机场订阅小组件（Egern 严格 DSL 版 / Apple 液态玻璃风）
// 环境变量：NAME1/URL1/RESET1 ... NAME8/URL8/RESET8

export default async function (ctx) {
  const MAX = 8;
  const slots = [];

  for (let i = 1; i <= MAX; i++) {
    const url = trim(ctx.env[`URL${i}`]);
    if (!url) continue;
    slots.push({
      name: trim(ctx.env[`NAME${i}`]) || inferName(url),
      url,
      resetDay: parseResetDay(ctx.env[`RESET${i}`]),
    });
  }

  const family = ctx.widgetFamily || "systemMedium";
  const style = getStyle(slots.length, family);
  const refreshAfter = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  if (!slots.length) {
    return buildEmptyWidget(refreshAfter);
  }

  const results = await Promise.all(slots.map((slot) => fetchInfo(ctx, slot)));

  return {
    type: "widget",
    padding: style.widgetPadding,
    gap: style.widgetGap,
    refreshAfter,
    backgroundGradient: buildAppleBackground(),
    children: [
      buildHeader(style),
      {
        type: "stack",
        direction: "column",
        gap: style.listGap,
        children: results.map((item, index) => buildRow(item, style, index, results.length)),
      },
    ],
  };
}

function buildAppleBackground() {
  return {
    type: "linear",
    colors: [
      { light: "#F9FBFF", dark: "#08111B" },
      { light: "#F3F7FD", dark: "#0B1622" },
      { light: "#EEF4FB", dark: "#102031" },
      { light: "#F7F9FC", dark: "#15253A" },
    ],
    stops: [0, 0.34, 0.72, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function buildEmptyWidget(refreshAfter) {
  return {
    type: "widget",
    padding: [15, 15, 15, 15],
    gap: 8,
    refreshAfter,
    backgroundGradient: buildAppleBackground(),
    children: [
      {
        type: "text",
        text: "订阅",
        font: { size: "caption1", weight: "semibold" },
        textColor: { light: "#76849A", dark: "#A2B1C6" },
      },
      {
        type: "text",
        text: "请配置 URL1 环境变量",
        font: { size: "subheadline", weight: "semibold" },
        textColor: { light: "#314255", dark: "#E5EDF7" },
      },
      {
        type: "text",
        text: "支持：NAME1/URL1/RESET1 ... NAME8/URL8/RESET8",
        font: { size: "caption2" },
        textColor: { light: "#7F8EA4", dark: "#91A1B8" },
        maxLines: 2,
        minScale: 0.8,
      },
    ],
  };
}

function buildHeader(style) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "start",
    children: [
      {
        type: "text",
        text: "订阅",
        font: { size: style.headerFont, weight: "semibold" },
        textColor: { light: "#7C8A9E", dark: "#A5B4C8" },
      },
      { type: "spacer" },
      {
        type: "date",
        date: new Date().toISOString(),
        format: "time",
        font: { size: style.metaFont, weight: "medium" },
        textColor: { light: "#98A5B7", dark: "#8D9CB1" },
      },
    ],
  };
}

function buildRow(item, style, index, total) {
  if (item.error) {
    return {
      type: "stack",
      direction: "column",
      gap: style.rowGap,
      children: [
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          gap: style.nameGap,
          children: [
            buildOrb({ light: "#D1D8E3", dark: "#A7B3C6" }, style),
            {
              type: "text",
              text: item.name,
              flex: 1,
              font: { size: style.nameFont, weight: "bold" },
              textColor: { light: "#243446", dark: "#F1F5FA" },
              maxLines: 1,
              minScale: 0.72,
            },
            {
              type: "text",
              text: "获取失败",
              font: { size: style.infoFont, weight: "medium" },
              textColor: { light: "#8B97A8", dark: "#A9B3C2" },
            },
          ],
        },
        buildDivider(style, index, total),
      ],
    };
  }

  const tone = getUsageTone(item.percent);
  const meta = getMetaText(item);

  return {
    type: "stack",
    direction: "column",
    gap: style.rowGap,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: style.nameGap,
        children: [
          buildOrb(tone.dotColor, style),
          {
            type: "text",
            text: item.name,
            flex: 1,
            font: { size: style.nameFont, weight: "bold" },
            textColor: { light: "#233346", dark: "#F5F8FD" },
            maxLines: 1,
            minScale: 0.72,
          },
          {
            type: "text",
            text: `${item.percent.toFixed(1)}%`,
            font: { size: style.percentFont, weight: "semibold" },
            textColor: tone.percentColor,
          },
        ],
      },
      buildArtBar(item.percent, tone, style),
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: `${bytesToSize(item.used)} / ${bytesToSize(item.totalBytes)}`,
            flex: 1,
            font: { size: style.infoFont, weight: "medium" },
            textColor: { light: "#607084", dark: "#B0BDCD" },
            maxLines: 1,
            minScale: 0.72,
          },
          {
            type: "text",
            text: meta.text,
            font: { size: style.metaFont, weight: "medium" },
            textColor: meta.color,
            maxLines: 1,
            minScale: 0.72,
          },
        ],
      },
      buildDivider(style, index, total),
    ],
  };
}

function buildOrb(color, style) {
  return {
    type: "stack",
    width: style.dotBox,
    height: style.dotBox,
    alignItems: "center",
    justifyContent: "center",
    children: [
      {
        type: "stack",
        width: style.dotSize,
        height: style.dotSize,
        backgroundGradient: {
          type: "linear",
          colors: [
            { light: "#FFFFFFE6", dark: "#FFFFFF44" },
            color,
          ],
          stops: [0, 1],
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 1 },
        },
        borderRadius: 99,
        children: [],
      },
    ],
  };
}

function buildDivider(style, index, total) {
  if (index === total - 1) return { type: "spacer", length: 0 };
  return {
    type: "stack",
    direction: "row",
    padding: [style.dividerTop, 0, 0, 0],
    children: [
      {
        type: "stack",
        flex: 1,
        height: 1,
        backgroundGradient: {
          type: "linear",
          colors: [
            { light: "#FFFFFF00", dark: "#FFFFFF00" },
            { light: "#D9E3EE70", dark: "#50627A44" },
            { light: "#E8EEF670", dark: "#62758D30" },
            { light: "#FFFFFF00", dark: "#FFFFFF00" },
          ],
          stops: [0, 0.22, 0.78, 1],
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 0 },
        },
        borderRadius: 99,
        children: [],
      },
    ],
  };
}

function buildArtBar(percent, tone, style) {
  const clamped = clamp(percent, 0, 100);
  const filled = Math.max(0.0001, clamped);
  const empty = Math.max(0.0001, 100 - clamped);

  return {
    type: "stack",
    direction: "column",
    gap: style.barGap,
    children: [
      {
        type: "stack",
        direction: "row",
        children: [
          {
            type: "stack",
            flex: filled,
            height: style.sheenHeight,
            backgroundGradient: {
              type: "linear",
              colors: tone.sheenColors,
              stops: [0, 0.5, 1],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 },
            },
            borderRadius: 99,
            children: [],
          },
          {
            type: "stack",
            flex: empty,
            height: style.sheenHeight,
            backgroundColor: { light: "#FFFFFF20", dark: "#FFFFFF08" },
            borderRadius: 99,
            children: [],
          },
        ],
      },
      {
        type: "stack",
        direction: "row",
        children: [
          {
            type: "stack",
            flex: filled,
            height: style.barHeight,
            backgroundGradient: {
              type: "linear",
              colors: tone.barColors,
              stops: [0, 0.42, 1],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 },
            },
            borderRadius: 99,
            children: [
              {
                type: "stack",
                direction: "row",
                children: [
                  {
                    type: "stack",
                    flex: Math.max(1, Math.round(filled * 0.2)),
                    height: style.barHeight,
                    backgroundColor: { light: "#FFFFFF55", dark: "#FFFFFF18" },
                    borderRadius: 99,
                    children: [],
                  },
                  { type: "spacer" },
                ],
              },
            ],
          },
          {
            type: "stack",
            flex: empty,
            height: style.barHeight,
            backgroundGradient: {
              type: "linear",
              colors: [
                { light: "#FFFFFF70", dark: "#1A273666" },
                { light: "#E7EDF540", dark: "#24364755" },
              ],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 },
            },
            borderRadius: 99,
            children: [],
          },
        ],
      },
    ],
  };
}

async function fetchInfo(ctx, slot) {
  const urls = buildVariants(slot.url);
  const methods = ["head", "get"];

  for (const method of methods) {
    for (const url of urls) {
      for (const headers of UA_LIST) {
        try {
          const response = await ctx.http[method](url, {
            headers,
            timeout: 12000,
            redirect: "follow",
            credentials: "omit",
          });

          const raw = response.headers.get("subscription-userinfo") || "";
          const info = parseUserInfo(raw);
          if (!info) continue;

          const used = (info.upload || 0) + (info.download || 0);
          const totalBytes = info.total || 0;
          const percent = totalBytes > 0 ? (used / totalBytes) * 100 : 0;

          return {
            name: slot.name,
            error: false,
            used,
            totalBytes,
            percent,
            expire: info.expire || null,
            remainDays: slot.resetDay ? getRemainingDays(slot.resetDay) : null,
          };
        } catch (e) {}
      }
    }
  }

  return {
    name: slot.name,
    error: true,
    used: 0,
    totalBytes: 0,
    percent: 0,
    expire: null,
    remainDays: slot.resetDay ? getRemainingDays(slot.resetDay) : null,
  };
}

const UA_LIST = [
  { "User-Agent": "Quantumult X" },
  { "User-Agent": "clash-verge-rev/2.3.1", Accept: "application/x-yaml,text/plain,*/*" },
  { "User-Agent": "mihomo/1.19.3", Accept: "application/x-yaml,text/plain,*/*" },
];

function buildVariants(url) {
  const list = [];
  const seen = new Set();

  function add(value) {
    if (!value || seen.has(value)) return;
    seen.add(value);
    list.push(value);
  }

  add(url);
  add(withParam(url, "flag", "clash"));
  add(withParam(url, "flag", "meta"));
  add(withParam(url, "target", "clash"));
  return list;
}

function withParam(url, key, value) {
  return `${url}${url.indexOf("?") >= 0 ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function parseUserInfo(header) {
  if (!header) return null;
  const pairs = header.match(/\w+=[\d.eE+-]+/g) || [];
  if (!pairs.length) return null;

  const result = {};
  for (const pair of pairs) {
    const parts = pair.split("=");
    result[parts[0]] = Number(parts[1]);
  }
  return result;
}

function getStyle(count, family) {
  const compact = family === "systemSmall" || family === "accessoryRectangular";
  const dense = count >= 5;
  const veryDense = count >= 7;

  return {
    widgetPadding: compact ? [11, 12, 11, 12] : dense ? [12, 13, 12, 13] : [13, 14, 13, 14],
    widgetGap: compact ? 6 : 7,
    listGap: veryDense ? 5 : dense ? 7 : 9,
    rowGap: veryDense ? 3 : 4,
    dividerTop: veryDense ? 4 : 6,
    headerFont: compact ? "caption2" : "caption1",
    metaFont: veryDense ? "caption2" : "caption1",
    nameFont: veryDense ? "caption1" : dense ? "subheadline" : "headline",
    infoFont: veryDense ? "caption2" : "caption1",
    percentFont: veryDense ? "caption2" : dense ? "caption1" : "subheadline",
    nameGap: veryDense ? 4 : 6,
    dotBox: veryDense ? 8 : 10,
    dotSize: veryDense ? 4 : 5,
    barGap: 2,
    sheenHeight: veryDense ? 1 : 2,
    barHeight: veryDense ? 4 : dense ? 5 : 6,
  };
}

function getUsageTone(percent) {
  if (percent >= 90) {
    return {
      dotColor: { light: "#D1908A", dark: "#F1AAA3" },
      percentColor: { light: "#A56A64", dark: "#F3B8B0" },
      sheenColors: [
        { light: "#FFF2F0", dark: "#FFB9A922" },
        { light: "#F5D0C8", dark: "#FFAF9D55" },
        { light: "#DFA096", dark: "#E8A29A88" },
      ],
      barColors: [
        { light: "#F8E3DF", dark: "#9E6C69" },
        { light: "#E9C1B9", dark: "#C38C83" },
        { light: "#D79A92", dark: "#E5A39B" },
      ],
    };
  }
  if (percent >= 70) {
    return {
      dotColor: { light: "#D3B07E", dark: "#E6C18A" },
      percentColor: { light: "#9A7A4B", dark: "#EEC88F" },
      sheenColors: [
        { light: "#FFF7EB", dark: "#E6C18A22" },
        { light: "#F3DAB2", dark: "#E2B56A55" },
        { light: "#D9B27B", dark: "#DDAE72AA" },
      ],
      barColors: [
        { light: "#F7EAD1", dark: "#937247" },
        { light: "#EACB9A", dark: "#B98D54" },
        { light: "#D9B27B", dark: "#DEAF71" },
      ],
    };
  }
  return {
    dotColor: { light: "#95AEC9", dark: "#A9C8E7" },
    percentColor: { light: "#6B7F96", dark: "#C6DCF3" },
    sheenColors: [
      { light: "#F7FAFE", dark: "#7EA6CF18" },
      { light: "#D8E6F4", dark: "#8AB6E033" },
      { light: "#B8CFE6", dark: "#9FC1E899" },
    ],
    barColors: [
      { light: "#EFF4FA", dark: "#526A84" },
      { light: "#D4E0EC", dark: "#7694B1" },
      { light: "#B9CFE5", dark: "#A5C3E2" },
    ],
  };
}

function getMetaText(item) {
  if (item.expire) {
    const daysLeft = Math.ceil((normalizeExpire(item.expire) - Date.now()) / 86400000);
    if (daysLeft < 0) {
      return {
        text: "已到期",
        color: { light: "#9DA8B7", dark: "#B8C2CE" },
      };
    }
    if (daysLeft <= 7) {
      return {
        text: `${daysLeft}天后到期`,
        color: { light: "#96724E", dark: "#D7B387" },
      };
    }
    return {
      text: formatDate(item.expire),
      color: { light: "#92A0B3", dark: "#97A6BA" },
    };
  }

  if (item.remainDays !== null) {
    return {
      text: `${item.remainDays}天重置`,
      color: item.remainDays <= 3
        ? { light: "#96724E", dark: "#D7B387" }
        : { light: "#92A0B3", dark: "#97A6BA" },
    };
  }

  return {
    text: "",
    color: { light: "#92A0B3", dark: "#97A6BA" },
  };
}

function bytesToSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, power);
  return `${value.toFixed(power === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[power]}`;
}

function formatDate(ts) {
  const date = new Date(normalizeExpire(ts));
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function normalizeExpire(ts) {
  return ts > 1e12 ? ts : ts * 1000;
}

function getRemainingDays(resetDay) {
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), resetDay);
  if (now.getDate() >= resetDay) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, resetDay);
  }
  return Math.max(0, Math.ceil((next - now) / 86400000));
}

function parseResetDay(value) {
  const n = parseInt(value || "", 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 31) return null;
  return n;
}

function inferName(url) {
  const matched = String(url).match(/^https?:\/\/([^/?#]+)/i);
  return matched ? matched[1] : "未命名机场";
}

function trim(value) {
  return String(value || "").trim();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}
