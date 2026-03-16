// 机场订阅小组件（严格按 Egern Widget DSL / JavaScript API 编写）
// 环境变量：NAME1/URL1/RESET1 ... NAME8/URL8/RESET8
// NAME: 机场名称（可选）
// URL: 订阅链接（必填）
// RESET: 每月重置日，例如 1 / 15 / 28（可选）

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
  const cards = results.map((item) => buildCard(item, style));

  return {
    type: "widget",
    padding: style.widgetPadding,
    gap: style.widgetGap,
    refreshAfter,
    backgroundGradient: {
      type: "linear",
      colors: [
        { light: "#EEF6FF", dark: "#07111F" },
        { light: "#DDEEFF", dark: "#0A1830" },
        { light: "#CFE8FF", dark: "#10244A" }
      ],
      stops: [0, 0.55, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      buildHeader(style),
      {
        type: "stack",
        direction: "column",
        gap: style.cardGap,
        children: cards,
      }
    ]
  };
}

function buildEmptyWidget(refreshAfter) {
  return {
    type: "widget",
    padding: 16,
    gap: 10,
    refreshAfter,
    backgroundGradient: {
      type: "linear",
      colors: [
        { light: "#EEF6FF", dark: "#07111F" },
        { light: "#DDEEFF", dark: "#0A1830" }
      ],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 8,
        children: [
          {
            type: "image",
            src: "sf-symbol:antenna.radiowaves.left.and.right",
            width: 16,
            height: 16,
            color: { light: "#0A84FF", dark: "#67D4FF" }
          },
          {
            type: "text",
            text: "机场订阅",
            font: { size: "headline", weight: "bold" },
            textColor: { light: "#10233A", dark: "#EAF4FF" }
          }
        ]
      },
      {
        type: "text",
        text: "请配置 URL1 环境变量",
        font: { size: "subheadline", weight: "medium" },
        textColor: { light: "#C62828", dark: "#FF8A80" }
      },
      {
        type: "text",
        text: "支持：NAME1/URL1/RESET1 ... NAME8/URL8/RESET8",
        font: { size: "caption1" },
        textColor: { light: "#5C6F82", dark: "#8EA3B8" },
        maxLines: 2,
        minScale: 0.8
      }
    ]
  };
}

function buildHeader(style) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "image",
            src: "sf-symbol:dot.radiowaves.left.and.right",
            width: style.headerIcon,
            height: style.headerIcon,
            color: { light: "#0A84FF", dark: "#67D4FF" }
          },
          {
            type: "text",
            text: "订阅监测",
            font: { size: style.headerFont, weight: "bold" },
            textColor: { light: "#10233A", dark: "#EAF4FF" }
          }
        ]
      },
      { type: "spacer" },
      {
        type: "date",
        date: new Date().toISOString(),
        format: "time",
        font: { size: style.metaFont, weight: "medium" },
        textColor: { light: "#5C6F82", dark: "#8EA3B8" }
      }
    ]
  };
}

function buildCard(item, style) {
  if (item.error) {
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 8,
      padding: style.cardPadding,
      backgroundColor: { light: "#FFFFFFCC", dark: "#0D1B2BCC" },
      borderRadius: style.cardRadius,
      borderWidth: 1,
      borderColor: { light: "#FFD5D5", dark: "#5D1E26" },
      children: [
        {
          type: "image",
          src: "sf-symbol:exclamationmark.triangle.fill",
          width: style.nameIcon,
          height: style.nameIcon,
          color: { light: "#FF3B30", dark: "#FF6B6B" }
        },
        {
          type: "text",
          text: item.name,
          flex: 1,
          font: { size: style.nameFont, weight: "bold" },
          textColor: { light: "#16212E", dark: "#F1F6FF" },
          maxLines: 1,
          minScale: 0.72
        },
        {
          type: "text",
          text: "获取失败",
          font: { size: style.metaFont, weight: "semibold" },
          textColor: { light: "#C62828", dark: "#FF8A80" }
        }
      ]
    };
  }

  const tone = getUsageTone(item.percent);
  const progressRow = buildProgressBar(item.percent, tone, style);
  const suffix = buildSuffix(item);

  return {
    type: "stack",
    direction: "column",
    gap: style.innerGap,
    padding: style.cardPadding,
    backgroundColor: { light: "#FFFFFFC8", dark: "#0C1A2ACC" },
    borderRadius: style.cardRadius,
    borderWidth: 1,
    borderColor: { light: "#BFDFFF", dark: "#17365A" },
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "image",
            src: "sf-symbol:circle.fill",
            width: style.nameIcon,
            height: style.nameIcon,
            color: tone.dotColor
          },
          {
            type: "text",
            text: item.name,
            flex: 1,
            font: { size: style.nameFont, weight: "bold" },
            textColor: { light: "#10233A", dark: "#F3F8FF" },
            maxLines: 1,
            minScale: 0.72
          },
          suffix
        ]
      },
      progressRow,
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
            textColor: { light: "#314356", dark: "#C4D7EB" },
            maxLines: 1,
            minScale: 0.72
          },
          {
            type: "text",
            text: `${item.percent.toFixed(1)}%`,
            font: { size: style.percentFont, weight: "bold" },
            textColor: tone.textColor
          }
        ]
      }
    ]
  };
}

function buildSuffix(item) {
  const meta = getMetaText(item);
  return {
    type: "text",
    text: meta.text,
    font: { size: meta.fontSize, weight: "medium" },
    textColor: meta.color,
    maxLines: 1,
    minScale: 0.72
  };
}

function buildProgressBar(percent, tone, style) {
  const clamped = clamp(percent, 0, 100);
  const filled = Math.max(0.0001, clamped);
  const empty = Math.max(0.0001, 100 - clamped);

  return {
    type: "stack",
    direction: "row",
    gap: style.progressGap,
    children: [
      {
        type: "stack",
        flex: filled,
        height: style.progressHeight,
        backgroundGradient: {
          type: "linear",
          colors: tone.barColors,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 0 }
        },
        borderRadius: 99,
        children: []
      },
      {
        type: "stack",
        flex: empty,
        height: style.progressHeight,
        backgroundColor: { light: "#D9E7F5", dark: "#21364C" },
        borderRadius: 99,
        children: []
      }
    ]
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
            credentials: "omit"
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
  { "User-Agent": "clash-verge-rev/2.3.1", "Accept": "application/x-yaml,text/plain,*/*" },
  { "User-Agent": "mihomo/1.19.3", "Accept": "application/x-yaml,text/plain,*/*" }
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
  const isCompact = family === "systemSmall" || family === "accessoryRectangular" || count >= 5;
  const isDense = count >= 6;

  return {
    widgetPadding: isCompact ? [12, 12, 12, 12] : [14, 14, 14, 14],
    widgetGap: isCompact ? 8 : 10,
    cardGap: count <= 2 ? 9 : count <= 4 ? 7 : 6,
    cardPadding: isDense ? [8, 10, 8, 10] : isCompact ? [9, 11, 9, 11] : [10, 12, 10, 12],
    cardRadius: isCompact ? 12 : 14,
    innerGap: isDense ? 5 : 6,
    progressHeight: isDense ? 5 : 6,
    progressGap: 2,
    headerFont: isCompact ? "caption1" : "subheadline",
    headerIcon: isCompact ? 12 : 13,
    metaFont: isDense ? "caption2" : "caption1",
    nameFont: isDense ? "caption1" : isCompact ? "subheadline" : "headline",
    infoFont: isDense ? "caption2" : "caption1",
    percentFont: isDense ? "caption1" : "subheadline",
    nameIcon: isDense ? 8 : 9,
  };
}

function getUsageTone(percent) {
  if (percent >= 90) {
    return {
      dotColor: { light: "#FF3B30", dark: "#FF6B6B" },
      textColor: { light: "#C62828", dark: "#FF8A80" },
      barColors: [
        { light: "#FF7A70", dark: "#FF8A80" },
        { light: "#FF3B30", dark: "#FF5252" }
      ]
    };
  }
  if (percent >= 70) {
    return {
      dotColor: { light: "#FF9500", dark: "#FFB74D" },
      textColor: { light: "#B26A00", dark: "#FFD180" },
      barColors: [
        { light: "#FFD166", dark: "#FFC947" },
        { light: "#FF9500", dark: "#FFB300" }
      ]
    };
  }
  return {
    dotColor: { light: "#00A6FB", dark: "#67D4FF" },
    textColor: { light: "#0068B3", dark: "#8AE3FF" },
    barColors: [
      { light: "#7BDFF2", dark: "#53D7FF" },
      { light: "#0A84FF", dark: "#1FA2FF" }
    ]
  };
}

function getMetaText(item) {
  if (item.expire) {
    const daysLeft = Math.ceil((normalizeExpire(item.expire) - Date.now()) / 86400000);
    if (daysLeft < 0) {
      return {
        text: "已到期",
        fontSize: "caption2",
        color: { light: "#C62828", dark: "#FF8A80" }
      };
    }
    if (daysLeft <= 7) {
      return {
        text: `${daysLeft}天后到期`,
        fontSize: "caption2",
        color: { light: "#B26A00", dark: "#FFD180" }
      };
    }
    return {
      text: formatDate(item.expire),
      fontSize: "caption2",
      color: { light: "#5C6F82", dark: "#8EA3B8" }
    };
  }

  if (item.remainDays !== null) {
    return {
      text: `${item.remainDays}天重置`,
      fontSize: "caption2",
      color: item.remainDays <= 3
        ? { light: "#B26A00", dark: "#FFD180" }
        : { light: "#5C6F82", dark: "#8EA3B8" }
    };
  }

  return {
    text: "",
    fontSize: "caption2",
    color: { light: "#5C6F82", dark: "#8EA3B8" }
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
