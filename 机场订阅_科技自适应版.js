// 机场订阅小组件（Egern 严格 DSL 版 / 液态玻璃艺术风）
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
    backgroundGradient: {
      type: "linear",
      colors: [
        { light: "#F8FBFF", dark: "#07111B" },
        { light: "#EEF6FF", dark: "#0B1730" },
        { light: "#F6F0FF", dark: "#111B3E" },
        { light: "#EAFBFF", dark: "#102747" }
      ],
      stops: [0, 0.35, 0.72, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      buildHeader(style),
      {
        type: "stack",
        direction: "column",
        gap: style.listGap,
        children: results.map((item, index) => buildRow(item, style, index, results.length))
      }
    ]
  };
}

function buildEmptyWidget(refreshAfter) {
  return {
    type: "widget",
    padding: [16, 16, 16, 16],
    gap: 10,
    refreshAfter,
    backgroundGradient: {
      type: "linear",
      colors: [
        { light: "#F8FBFF", dark: "#07111B" },
        { light: "#EEF6FF", dark: "#0B1730" },
        { light: "#F6F0FF", dark: "#111B3E" }
      ],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    children: [
      {
        type: "text",
        text: "机场订阅",
        font: { size: "headline", weight: "bold" },
        textColor: { light: "#16253A", dark: "#ECF5FF" }
      },
      {
        type: "text",
        text: "请配置 URL1 环境变量",
        font: { size: "subheadline", weight: "semibold" },
        textColor: { light: "#8D3C7A", dark: "#FF9EE8" }
      },
      {
        type: "text",
        text: "支持：NAME1/URL1/RESET1 ... NAME8/URL8/RESET8",
        font: { size: "caption1" },
        textColor: { light: "#62728A", dark: "#9CB0C8" },
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
        direction: "column",
        gap: 2,
        children: [
          {
            type: "text",
            text: "AIRPORT FLOW",
            font: { size: style.kickerFont, weight: "semibold" },
            textColor: { light: "#7D7AAE", dark: "#8FA4FF" },
            opacity: 0.88
          },
          {
            type: "text",
            text: "订阅流量",
            font: { size: style.headerFont, weight: "bold" },
            textColor: { light: "#15263C", dark: "#EEF6FF" }
          }
        ]
      },
      { type: "spacer" },
      {
        type: "date",
        date: new Date().toISOString(),
        format: "time",
        font: { size: style.metaFont, weight: "medium" },
        textColor: { light: "#6F7F96", dark: "#98ABC4" }
      }
    ]
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
          gap: 8,
          children: [
            {
              type: "image",
              src: "sf-symbol:smallcircle.filled.circle.fill",
              width: style.dotSize,
              height: style.dotSize,
              color: { light: "#FF7AA8", dark: "#FF99C7" }
            },
            {
              type: "text",
              text: item.name,
              flex: 1,
              font: { size: style.nameFont, weight: "bold" },
              textColor: { light: "#16253A", dark: "#F4F8FF" },
              maxLines: 1,
              minScale: 0.7
            },
            {
              type: "text",
              text: "获取失败",
              font: { size: style.infoFont, weight: "semibold" },
              textColor: { light: "#C24B80", dark: "#FFA8D1" }
            }
          ]
        },
        buildDivider(style, index, total)
      ]
    };
  }

  const tone = getUsageTone(item.percent);

  return {
    type: "stack",
    direction: "column",
    gap: style.rowGap,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 8,
        children: [
          {
            type: "image",
            src: "sf-symbol:smallcircle.filled.circle.fill",
            width: style.dotSize,
            height: style.dotSize,
            color: tone.dotColor
          },
          {
            type: "text",
            text: item.name,
            flex: 1,
            font: { size: style.nameFont, weight: "bold" },
            textColor: { light: "#14253A", dark: "#F5F8FF" },
            maxLines: 1,
            minScale: 0.7
          },
          {
            type: "text",
            text: `${item.percent.toFixed(1)}%`,
            font: { size: style.percentFont, weight: "bold" },
            textColor: tone.percentColor
          }
        ]
      },
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
            textColor: { light: "#45556C", dark: "#B6C6DB" },
            maxLines: 1,
            minScale: 0.72
          },
          {
            type: "text",
            text: getMetaText(item).text,
            font: { size: style.metaFont, weight: "medium" },
            textColor: getMetaText(item).color,
            maxLines: 1,
            minScale: 0.72
          }
        ]
      },
      buildArtBar(item.percent, tone, style),
      buildDivider(style, index, total)
    ]
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
            { light: "#DDE7FFAA", dark: "#8AA4FF66" },
            { light: "#CFF7FFAA", dark: "#74F0FF66" },
            { light: "#FFFFFF00", dark: "#FFFFFF00" }
          ],
          stops: [0, 0.24, 0.76, 1],
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 0 }
        },
        borderRadius: 99,
        children: []
      }
    ]
  };
}

function buildArtBar(percent, tone, style) {
  const clamped = clamp(percent, 0, 100);
  const filled = Math.max(0.0001, clamped);
  const empty = Math.max(0.0001, 100 - clamped);
  const glowFlex = Math.max(4, Math.min(12, Math.round(clamped / 9) || 4));

  return {
    type: "stack",
    direction: "column",
    gap: 3,
    children: [
      {
        type: "stack",
        direction: "row",
        children: [
          {
            type: "stack",
            flex: filled,
            height: style.glowHeight,
            backgroundGradient: {
              type: "linear",
              colors: tone.glowColors,
              stops: [0, 0.5, 1],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 }
            },
            borderRadius: 99,
            children: [
              {
                type: "stack",
                direction: "row",
                children: [
                  { type: "spacer" },
                  {
                    type: "stack",
                    flex: glowFlex,
                    height: style.glowHeight,
                    backgroundColor: { light: "#FFFFFFB8", dark: "#FFFFFF55" },
                    borderRadius: 99,
                    children: []
                  }
                ]
              }
            ]
          },
          {
            type: "stack",
            flex: empty,
            height: style.glowHeight,
            backgroundColor: { light: "#FFFFFF12", dark: "#FFFFFF08" },
            borderRadius: 99,
            children: []
          }
        ]
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
              stops: [0, 0.38, 1],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 }
            },
            borderRadius: 99,
            children: []
          },
          {
            type: "stack",
            flex: empty,
            height: style.barHeight,
            backgroundGradient: {
              type: "linear",
              colors: [
                { light: "#FFFFFF55", dark: "#FFFFFF12" },
                { light: "#E4EEFA55", dark: "#24344F66" }
              ],
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 1, y: 0 }
            },
            borderRadius: 99,
            children: []
          }
        ]
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
  const compact = family === "systemSmall" || family === "accessoryRectangular";
  const dense = count >= 5;
  const veryDense = count >= 7;

  return {
    widgetPadding: compact ? [12, 12, 12, 12] : dense ? [12, 13, 12, 13] : [14, 15, 14, 15],
    widgetGap: compact ? 8 : 10,
    listGap: veryDense ? 6 : dense ? 8 : 10,
    rowGap: veryDense ? 3 : 4,
    dividerTop: veryDense ? 4 : 6,
    headerFont: compact ? "subheadline" : dense ? "headline" : "title3",
    kickerFont: compact ? "caption2" : "caption1",
    metaFont: veryDense ? "caption2" : "caption1",
    nameFont: veryDense ? "caption1" : dense ? "subheadline" : "headline",
    infoFont: veryDense ? "caption2" : "caption1",
    percentFont: veryDense ? "caption1" : dense ? "subheadline" : "headline",
    dotSize: veryDense ? 7 : 8,
    glowHeight: veryDense ? 3 : 4,
    barHeight: veryDense ? 4 : dense ? 5 : 6,
  };
}

function getUsageTone(percent) {
  if (percent >= 90) {
    return {
      dotColor: { light: "#FF73B3", dark: "#FF98CE" },
      percentColor: { light: "#C34A8C", dark: "#FFB4DE" },
      glowColors: [
        { light: "#FFD7EC", dark: "#FF9BD466" },
        { light: "#FF9CD1", dark: "#FF7FC4AA" },
        { light: "#FF73B3", dark: "#FF73B3CC" }
      ],
      barColors: [
        { light: "#FFC8E6", dark: "#FF98CE" },
        { light: "#FF94CB", dark: "#FF73B3" },
        { light: "#FF73B3", dark: "#E55EFF" }
      ]
    };
  }
  if (percent >= 70) {
    return {
      dotColor: { light: "#FF9E59", dark: "#FFC07F" },
      percentColor: { light: "#C97835", dark: "#FFD29F" },
      glowColors: [
        { light: "#FFE7CF", dark: "#FFC07F55" },
        { light: "#FFC992", dark: "#FFB36ECC" },
        { light: "#FF9E59", dark: "#FF9E59CC" }
      ],
      barColors: [
        { light: "#FFE1BF", dark: "#FFD39A" },
        { light: "#FFC07A", dark: "#FFB36E" },
        { light: "#FF9E59", dark: "#FF8A5C" }
      ]
    };
  }
  return {
    dotColor: { light: "#6B8CFF", dark: "#8DDCFF" },
    percentColor: { light: "#5A67D8", dark: "#B2EEFF" },
    glowColors: [
      { light: "#E4E7FF", dark: "#7E8EFF44" },
      { light: "#B9D8FF", dark: "#6FA2FF99" },
      { light: "#8AE7FF", dark: "#72EEFFCC" }
    ],
    barColors: [
      { light: "#D8D9FF", dark: "#7C8DFF" },
      { light: "#A0C4FF", dark: "#62B8FF" },
      { light: "#86F1FF", dark: "#72EEFF" }
    ]
  };
}

function getMetaText(item) {
  if (item.expire) {
    const daysLeft = Math.ceil((normalizeExpire(item.expire) - Date.now()) / 86400000);
    if (daysLeft < 0) {
      return {
        text: "已到期",
        color: { light: "#C24B80", dark: "#FFADD3" }
      };
    }
    if (daysLeft <= 7) {
      return {
        text: `${daysLeft}天后到期`,
        color: { light: "#C97835", dark: "#FFD29F" }
      };
    }
    return {
      text: formatDate(item.expire),
      color: { light: "#6F7F96", dark: "#97AAC5" }
    };
  }

  if (item.remainDays !== null) {
    return {
      text: `${item.remainDays}天重置`,
      color: item.remainDays <= 3
        ? { light: "#C97835", dark: "#FFD29F" }
        : { light: "#6F7F96", dark: "#97AAC5" }
    };
  }

  return {
    text: "",
    color: { light: "#6F7F96", dark: "#97AAC5" }
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
