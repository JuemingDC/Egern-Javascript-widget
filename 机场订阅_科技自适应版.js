// 机场订阅小组件 · 科技风自适应版
// 环境变量：NAME1/URL1/RESET1 ... NAME8/URL8/RESET8
// 设计目标：
// 1. 科技风玻璃卡片 + 昼夜自动切换
// 2. 机场名称更突出，其余信息保持高可读性
// 3. 多机场时自动缩放字号、间距与卡片密度
// 4. 避免无效留白，提升信息密度

export default async function (ctx) {
  const MAX = 8;
  const slots = [];

  for (let i = 1; i <= MAX; i++) {
    const url = (ctx.env[`URL${i}`] || "").trim();
    if (!url) continue;
    slots.push({
      name: (ctx.env[`NAME${i}`] || "").trim() || inferName(url),
      url,
      resetDay: parseInt(ctx.env[`RESET${i}`] || "", 10) || null,
    });
  }

  const refreshTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const density = getDensity(slots.length);

  if (!slots.length) {
    return {
      type: "widget",
      padding: 16,
      gap: 10,
      backgroundGradient: themeBg(),
      refreshAfter: refreshTime,
      children: [
        buildHeader(timeStr, density, true),
        { type: "spacer" },
        {
          type: "stack",
          direction: "column",
          alignItems: "center",
          gap: 8,
          padding: [18, 16, 18, 16],
          backgroundColor: c("#FFFFFFB8", "#0A1222CC"),
          borderRadius: 18,
          borderWidth: 1,
          borderColor: c("#7DD3FC33", "#67E8F933"),
          children: [
            {
              type: "image",
              src: "sf-symbol:antenna.radiowaves.left.and.right",
              width: 20,
              height: 20,
              color: c("#0EA5E9", "#67E8F9"),
            },
            {
              type: "text",
              text: "请先配置 URL1 环境变量",
              font: { size: "caption1", weight: "semibold" },
              textColor: c("#0F172A", "#E2F3FF"),
              textAlign: "center",
            },
          ],
        },
      ],
    };
  }

  const results = await Promise.all(slots.map((s) => fetchInfo(ctx, s)));
  const cards = results.map((r) => buildCard(r, slots.length, density));

  return {
    type: "widget",
    padding: density.widgetPadding,
    gap: density.widgetGap,
    backgroundGradient: themeBg(),
    refreshAfter: refreshTime,
    children: [
      buildHeader(timeStr, density, false),
      {
        type: "stack",
        direction: "column",
        gap: density.cardGap,
        children: cards,
      },
      { type: "spacer" },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────

function buildHeader(timeStr, density, empty) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 6,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        padding: empty ? [5, 8, 5, 8] : [4, 8, 4, 8],
        backgroundColor: c("#FFFFFFA6", "#09111F99"),
        borderRadius: 99,
        borderWidth: 1,
        borderColor: c("#38BDF81F", "#67E8F926"),
        children: [
          {
            type: "image",
            src: "sf-symbol:waveform.path.ecg.rectangle.fill",
            width: density.headerIcon,
            height: density.headerIcon,
            color: c("#0284C7", "#5EEAD4"),
          },
          {
            type: "text",
            text: "Traffic Monitor",
            font: { size: density.headerText, weight: "semibold" },
            textColor: c("#0F172A99", "#D9F7FF99"),
          },
        ],
      },
      { type: "spacer" },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          {
            type: "image",
            src: "sf-symbol:clock.arrow.circlepath",
            width: density.timeIcon,
            height: density.timeIcon,
            color: c("#0F172A55", "#E2F3FF55"),
          },
          {
            type: "text",
            text: timeStr,
            font: { size: density.timeText, weight: "medium" },
            textColor: c("#0F172A66", "#E2F3FF66"),
          },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────

function buildCard(result, total, density) {
  const { name, error, used, totalBytes, percent, expire, remainDays } = result;

  const usageColor =
    error
      ? c("#DC2626", "#FF6B6B")
      : percent >= 90
      ? c("#DC2626", "#FF6B6B")
      : percent >= 70
      ? c("#D97706", "#FFB020")
      : c("#059669", "#34D399");

  if (error) {
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 8,
      padding: density.cardPadding,
      backgroundColor: c("#FFFFFFB5", "#08101CCC"),
      borderRadius: density.cardRadius,
      borderWidth: 1,
      borderColor: c("#EF444433", "#FF6B6B33"),
      children: [
        {
          type: "image",
          src: "sf-symbol:exclamationmark.triangle.fill",
          width: density.statusIcon,
          height: density.statusIcon,
          color: c("#DC2626", "#FF6B6B"),
        },
        {
          type: "text",
          text: name,
          font: { size: density.nameText, weight: "bold" },
          textColor: c("#0F172A", "#F8FBFF"),
          maxLines: 1,
          minScale: 0.72,
          flex: 1,
        },
        {
          type: "text",
          text: "获取失败",
          font: { size: density.metaText, weight: "semibold" },
          textColor: c("#B91C1C", "#FF8A8A"),
        },
      ],
    };
  }

  let expireText = "";
  let expireColor = c("#475569AA", "#B8D7F6A8");
  if (expire) {
    const daysLeft = Math.ceil((expire * 1000 - Date.now()) / 86400000);
    if (daysLeft < 0) {
      expireText = "已到期";
      expireColor = c("#DC2626", "#FF6B6B");
    } else if (daysLeft <= 7) {
      expireText = `${daysLeft}天后到期`;
      expireColor = c("#D97706", "#FFB020");
    } else {
      expireText = formatDate(expire);
    }
  } else if (remainDays !== null) {
    expireText = `${remainDays}天重置`;
    expireColor = remainDays <= 3 ? c("#D97706", "#FFB020") : c("#475569AA", "#B8D7F6A8");
  }

  const safePercent = Math.min(Math.max(percent || 0, 0), 100);
  const isSingle = total === 1;
  const usedText = `${bytesToSize(used)} / ${bytesToSize(totalBytes)}`;

  return {
    type: "stack",
    direction: "column",
    gap: density.innerGap,
    padding: density.cardPadding,
    backgroundColor: c("#FFFFFFB8", "#08101DCC"),
    borderRadius: density.cardRadius,
    borderWidth: 1,
    borderColor: c("#38BDF81F", "#67E8F926"),
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "stack",
            width: density.dot,
            height: density.dot,
            borderRadius: 99,
            backgroundColor: usageColor,
            children: [],
          },
          {
            type: "text",
            text: name,
            font: { size: density.nameText, weight: "bold" },
            textColor: c("#0F172A", "#F8FBFF"),
            maxLines: 1,
            minScale: 0.72,
            flex: 1,
          },
          ...(expireText
            ? [
                {
                  type: "text",
                  text: expireText,
                  font: { size: density.metaText, weight: "medium" },
                  textColor: expireColor,
                },
              ]
            : []),
        ],
      },

      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 8,
        children: [
          {
            type: "text",
            text: usedText,
            font: { size: density.dataText, weight: "medium" },
            textColor: c("#334155", "#CDE7FFCC"),
            maxLines: 1,
            minScale: 0.72,
            flex: 1,
          },
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 3,
            padding: density.percentBadgePadding,
            backgroundColor: c("#E0F2FECC", "#0E1B31CC"),
            borderRadius: 99,
            borderWidth: 1,
            borderColor: c("#38BDF826", "#67E8F926"),
            children: [
              {
                type: "image",
                src: isSingle ? "sf-symbol:gauge.with.dots.needle.67percent" : "sf-symbol:bolt.horizontal.circle.fill",
                width: density.percentIcon,
                height: density.percentIcon,
                color: usageColor,
              },
              {
                type: "text",
                text: `${safePercent.toFixed(total >= 6 ? 0 : 1)}%`,
                font: { size: density.percentText, weight: "bold" },
                textColor: usageColor,
              },
            ],
          },
        ],
      },

      buildProgressBar(safePercent, usageColor, density),
    ],
  };
}

function buildProgressBar(percent, usageColor, density) {
  return {
    type: "stack",
    direction: "column",
    gap: 4,
    children: [
      {
        type: "stack",
        height: density.progressTrackHeight,
        backgroundColor: c("#CFE8F766", "#102038E6"),
        borderRadius: 99,
        children: [
          {
            type: "stack",
            width: `${Math.max(4, percent)}%`,
            height: density.progressFillHeight,
            backgroundGradient: progressGradient(percent),
            borderRadius: 99,
            children: [],
          },
        ],
      },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: percent >= 90 ? "高负载" : percent >= 70 ? "注意余量" : "状态良好",
            font: { size: density.statusText, weight: "medium" },
            textColor: c("#475569B3", "#B7D7F5A8"),
          },
          { type: "spacer" },
          {
            type: "text",
            text: `${Math.max(0, 100 - percent).toFixed(percent >= 95 ? 0 : 1)}% 可用`,
            font: { size: density.statusText, weight: "medium" },
            textColor: c("#475569B3", "#B7D7F5A8"),
          },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// Network
// ─────────────────────────────────────────────────────────────

const UA_LIST = [
  { "User-Agent": "Quantumult%20X/1.5.2" },
  { "User-Agent": "clash-verge-rev/2.3.1", Accept: "application/x-yaml,text/plain,*/*" },
  { "User-Agent": "mihomo/1.19.3", Accept: "application/x-yaml,text/plain,*/*" },
];

async function fetchInfo(ctx, slot) {
  const urls = buildVariants(slot.url);

  for (const method of ["head", "get"]) {
    for (const url of urls) {
      for (const headers of UA_LIST) {
        try {
          const resp = await ctx.http[method](url, { headers, timeout: 9000 });
          const raw = resp.headers.get("subscription-userinfo") || "";
          const info = parseUserInfo(raw);
          if (info) {
            const used = (info.upload || 0) + (info.download || 0);
            const totalBytes = info.total || 0;
            const percent = totalBytes > 0 ? (used / totalBytes) * 100 : 0;
            return {
              name: slot.name,
              error: null,
              used,
              totalBytes,
              percent,
              expire: info.expire || null,
              remainDays: slot.resetDay ? getRemainingDays(slot.resetDay) : null,
            };
          }
        } catch (_) {}
      }
    }
  }

  return { name: slot.name, error: true };
}

function buildVariants(url) {
  const seen = new Set();
  const out = [];
  const add = (u) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  };
  add(url);
  add(withParam(url, "flag", "clash"));
  add(withParam(url, "flag", "meta"));
  add(withParam(url, "target", "clash"));
  return out;
}

function withParam(url, key, value) {
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function parseUserInfo(header) {
  if (!header) return null;
  const pairs = header.match(/\w+=[\d.eE+-]+/g) || [];
  if (!pairs.length) return null;
  return Object.fromEntries(
    pairs.map((p) => {
      const [k, v] = p.split("=");
      return [k, Number(v)];
    })
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getDensity(count) {
  if (count <= 1) {
    return {
      widgetPadding: [14, 14, 12, 14],
      widgetGap: 10,
      cardGap: 8,
      cardPadding: [12, 13, 12, 13],
      cardRadius: 16,
      innerGap: 8,
      headerIcon: 13,
      headerText: "caption1",
      timeIcon: 11,
      timeText: "caption2",
      nameText: "body",
      dataText: "caption1",
      metaText: "caption2",
      percentText: "caption1",
      percentIcon: 11,
      statusText: "caption2",
      statusIcon: 13,
      dot: 8,
      progressTrackHeight: 8,
      progressFillHeight: 8,
      percentBadgePadding: [4, 7, 4, 7],
    };
  }
  if (count <= 3) {
    return {
      widgetPadding: [13, 13, 11, 13],
      widgetGap: 9,
      cardGap: 7,
      cardPadding: [10, 11, 10, 11],
      cardRadius: 14,
      innerGap: 7,
      headerIcon: 12,
      headerText: "caption2",
      timeIcon: 10,
      timeText: "caption2",
      nameText: "caption1",
      dataText: "caption2",
      metaText: "caption2",
      percentText: "caption2",
      percentIcon: 10,
      statusText: "caption2",
      statusIcon: 12,
      dot: 7,
      progressTrackHeight: 7,
      progressFillHeight: 7,
      percentBadgePadding: [3, 6, 3, 6],
    };
  }
  if (count <= 5) {
    return {
      widgetPadding: [12, 12, 10, 12],
      widgetGap: 8,
      cardGap: 6,
      cardPadding: [9, 10, 9, 10],
      cardRadius: 13,
      innerGap: 6,
      headerIcon: 12,
      headerText: "caption2",
      timeIcon: 10,
      timeText: "caption2",
      nameText: "caption1",
      dataText: "caption2",
      metaText: "caption2",
      percentText: "caption2",
      percentIcon: 9,
      statusText: "caption2",
      statusIcon: 11,
      dot: 6,
      progressTrackHeight: 6,
      progressFillHeight: 6,
      percentBadgePadding: [2, 6, 2, 6],
    };
  }
  return {
    widgetPadding: [11, 11, 9, 11],
    widgetGap: 7,
    cardGap: 5,
    cardPadding: [8, 9, 8, 9],
    cardRadius: 12,
    innerGap: 5,
    headerIcon: 11,
    headerText: "caption2",
    timeIcon: 9,
    timeText: "caption2",
    nameText: "caption2",
    dataText: "caption2",
    metaText: "caption2",
    percentText: "caption2",
    percentIcon: 9,
    statusText: "caption2",
    statusIcon: 10,
    dot: 6,
    progressTrackHeight: 5,
    progressFillHeight: 5,
    percentBadgePadding: [2, 5, 2, 5],
  };
}

function progressGradient(percent) {
  if (percent >= 90) {
    return {
      type: "linear",
      colors: [c("#FB7185", "#FF6B6B"), c("#EF4444", "#FF3B30")],
      stops: [0, 1],
      startPoint: { x: 0, y: 0.5 },
      endPoint: { x: 1, y: 0.5 },
    };
  }
  if (percent >= 70) {
    return {
      type: "linear",
      colors: [c("#FBBF24", "#FFD166"), c("#F97316", "#FF9F0A")],
      stops: [0, 1],
      startPoint: { x: 0, y: 0.5 },
      endPoint: { x: 1, y: 0.5 },
    };
  }
  return {
    type: "linear",
    colors: [c("#22D3EE", "#67E8F9"), c("#14B8A6", "#2DD4BF")],
    stops: [0, 1],
    startPoint: { x: 0, y: 0.5 },
    endPoint: { x: 1, y: 0.5 },
  };
}

function themeBg() {
  return {
    type: "linear",
    colors: [
      c("#F4FBFF", "#050B14"),
      c("#EAF6FF", "#081120"),
      c("#E9F2FF", "#0A1630"),
      c("#F8FCFF", "#07101F"),
    ],
    stops: [0, 0.35, 0.72, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function c(light, dark) {
  return { light, dark };
}

function bytesToSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : bytes >= 100 * Math.pow(1024, i) ? 0 : 2)} ${units[i]}`;
}

function formatDate(ts) {
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getRemainingDays(resetDay) {
  const now = new Date();
  const day = now.getDate();
  let next = new Date(now.getFullYear(), now.getMonth(), resetDay);
  if (day >= resetDay) next = new Date(now.getFullYear(), now.getMonth() + 1, resetDay);
  return Math.max(0, Math.ceil((next - now) / 86400000));
}

function inferName(url) {
  const m = url.match(/^https?:\/\/([^\/?#]+)/i);
  return m ? m[1] : "未命名订阅";
}
