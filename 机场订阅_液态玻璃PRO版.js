// 机场订阅流量面板 · Liquid Glass Pro
// 设计目标：
// 1) 更科技感、更克制的液态玻璃配色
// 2) 自动适配浅色 / 深色模式
// 3) 多订阅情况下自动缩放字号与间距，保证信息完整显示
// 4) 保留原有环境变量：NAME1/URL1/RESET1 ... NAME5/URL5/RESET5
// 5) 不改动原始数据获取逻辑，只重构 UI 与排版

export default async function (ctx) {
  const MAX = 5;
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
  const theme = getTheme();

  if (!slots.length) {
    return {
      type: "widget",
      padding: density.padding,
      gap: density.sectionGap,
      backgroundGradient: theme.backgroundGradient,
      refreshAfter: refreshTime,
      children: [
        buildHeader(timeStr, density, theme, 0),
        {
          type: "spacer",
          length: 4,
        },
        {
          type: "text",
          text: "请先配置 URL1 环境变量",
          font: { size: density.emptyTitleSize, weight: "semibold" },
          textColor: theme.warn,
          textAlign: "center",
        },
        {
          type: "text",
          text: "支持最多 5 个机场订阅，自动适配布局。",
          font: { size: density.emptySubSize, weight: "medium" },
          textColor: theme.secondary,
          textAlign: "center",
          maxLines: 2,
          minScale: 0.85,
        },
      ],
    };
  }

  const results = await Promise.all(slots.map((s) => fetchInfo(ctx, s)));

  const listChildren = [];
  results.forEach((item, idx) => {
    listChildren.push(buildRow(item, idx, density, theme));
    if (idx !== results.length - 1) {
      listChildren.push(buildDivider(theme, density));
    }
  });

  return {
    type: "widget",
    padding: density.padding,
    gap: density.sectionGap,
    backgroundGradient: theme.backgroundGradient,
    refreshAfter: refreshTime,
    children: [
      buildHeader(timeStr, density, theme, results.length),
      {
        type: "stack",
        direction: "column",
        gap: density.rowGap,
        children: listChildren,
      },
    ],
  };
}

function c(light, dark) {
  return { light, dark };
}

function getTheme() {
  return {
    backgroundGradient: {
      type: "linear",
      colors: [
        c("#F7FBFF", "#09111E"),
        c("#E8F1FF", "#10213A"),
        c("#DDEBFF", "#173259"),
        c("#F6FBFF", "#0B1727"),
      ],
      stops: [0, 0.32, 0.72, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    title: c("#10203A", "#F3F8FF"),
    primary: c("#18304C", "#EAF3FF"),
    secondary: c("#516B8A", "#A9BEDC"),
    tertiary: c("rgba(62,92,128,0.78)", "rgba(183,204,234,0.70)"),
    faint: c("rgba(76,103,138,0.42)", "rgba(186,207,238,0.20)"),
    glass: c("rgba(255,255,255,0.20)", "rgba(255,255,255,0.06)"),
    glow: c("rgba(126,181,255,0.30)", "rgba(120,189,255,0.16)"),
    lineStart: c("rgba(95,147,230,0)", "rgba(126,179,255,0)"),
    lineMid: c("rgba(102,157,241,0.52)", "rgba(132,188,255,0.46)"),
    lineEnd: c("rgba(95,147,230,0)", "rgba(126,179,255,0)"),
    accent: c("#2F7BFF", "#8CC8FF"),
    ok: c("#11A56F", "#69E3B4"),
    warm: c("#D38A12", "#FFC86A"),
    danger: c("#D64545", "#FF8F96"),
    warn: c("#D6543D", "#FFB29F"),
  };
}

function getDensity(count) {
  if (count <= 1) {
    return {
      padding: [15, 16, 14, 16],
      sectionGap: 11,
      rowGap: 9,
      headerTitle: 14,
      headerSub: 11,
      name: 16,
      sub: 11,
      remain: 23,
      percent: 12,
      meta: 11,
      progress: 5,
      dividerGap: 8,
      emptyTitleSize: 14,
      emptySubSize: 11,
    };
  }
  if (count === 2) {
    return {
      padding: [14, 16, 13, 16],
      sectionGap: 10,
      rowGap: 8,
      headerTitle: 13,
      headerSub: 11,
      name: 15,
      sub: 10,
      remain: 20,
      percent: 11,
      meta: 10,
      progress: 5,
      dividerGap: 7,
      emptyTitleSize: 14,
      emptySubSize: 11,
    };
  }
  if (count <= 4) {
    return {
      padding: [13, 15, 12, 15],
      sectionGap: 9,
      rowGap: 7,
      headerTitle: 13,
      headerSub: 10,
      name: 14,
      sub: 10,
      remain: 18,
      percent: 11,
      meta: 10,
      progress: 4,
      dividerGap: 6,
      emptyTitleSize: 13,
      emptySubSize: 10,
    };
  }
  return {
    padding: [12, 14, 11, 14],
    sectionGap: 8,
    rowGap: 6,
    headerTitle: 12,
    headerSub: 10,
    name: 13,
    sub: 9,
    remain: 16,
    percent: 10,
    meta: 9,
    progress: 4,
    dividerGap: 5,
    emptyTitleSize: 13,
    emptySubSize: 10,
  };
}

function buildHeader(timeStr, density, theme, count) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "spacer",
      },
      {
        type: "stack",
        direction: "column",
        gap: 1,
        children: [
          {
            type: "text",
            text: "机场订阅",
            font: { size: density.headerTitle, weight: "bold" },
            textColor: theme.title,
            textAlign: "center",
          },
          {
            type: "text",
            text: count ? `${count} 个订阅 · 实时流量面板` : "Liquid Glass Flow Panel",
            font: { size: density.headerSub, weight: "medium" },
            textColor: theme.secondary,
            textAlign: "center",
            maxLines: 1,
            minScale: 0.8,
          },
        ],
      },
      {
        type: "spacer",
      },
      {
        type: "text",
        text: timeStr,
        font: { size: density.headerSub, weight: "medium", family: "Menlo" },
        textColor: theme.tertiary,
      },
    ],
  };
}

function buildDivider(theme, density) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      { type: "spacer", length: density.dividerGap },
      {
        type: "stack",
        flex: 1,
        height: 1,
        backgroundGradient: {
          type: "linear",
          colors: [theme.lineStart, theme.lineMid, theme.lineEnd],
          stops: [0, 0.5, 1],
          startPoint: { x: 0, y: 0.5 },
          endPoint: { x: 1, y: 0.5 },
        },
        children: [],
      },
      { type: "spacer", length: density.dividerGap },
    ],
  };
}

function buildRow(result, idx, density, theme) {
  const { name, error, used, totalBytes, percent, expire, remainDays } = result;

  if (error) {
    return {
      type: "stack",
      direction: "column",
      gap: 3,
      children: [
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "text",
              text: name,
              font: { size: density.name, weight: "bold" },
              textColor: theme.primary,
              maxLines: 1,
              minScale: 0.72,
              flex: 1,
            },
            {
              type: "text",
              text: "获取失败",
              font: { size: density.meta, weight: "semibold", family: "Menlo" },
              textColor: theme.warn,
              maxLines: 1,
            },
          ],
        },
        {
          type: "text",
          text: "请检查订阅链接或面板是否返回 subscription-userinfo。",
          font: { size: density.sub, weight: "medium" },
          textColor: theme.secondary,
          maxLines: 2,
          minScale: 0.8,
        },
      ],
    };
  }

  const remainingBytes = Math.max(0, totalBytes - used);
  const remainingText = bytesToSize(remainingBytes);
  const totalText = bytesToSize(totalBytes);
  const usedText = bytesToSize(used);
  const ratio = Math.min(Math.max(percent, 0), 100);
  const usageColor = pickUsageColor(ratio, theme);

  let rightMeta = "";
  let rightMetaColor = theme.secondary;

  if (expire) {
    const daysLeft = Math.ceil((expire * 1000 - Date.now()) / 86400000);
    if (daysLeft < 0) {
      rightMeta = "已到期";
      rightMetaColor = theme.danger;
    } else if (daysLeft <= 3) {
      rightMeta = `${daysLeft}天到期`;
      rightMetaColor = theme.danger;
    } else if (daysLeft <= 10) {
      rightMeta = `${daysLeft}天到期`;
      rightMetaColor = theme.warm;
    } else {
      rightMeta = formatDate(expire);
      rightMetaColor = theme.secondary;
    }
  } else if (remainDays !== null) {
    rightMeta = `${remainDays}天重置`;
    rightMetaColor = remainDays <= 3 ? theme.warm : theme.secondary;
  } else {
    rightMeta = "流量周期中";
    rightMetaColor = theme.tertiary;
  }

  return {
    type: "stack",
    direction: "column",
    gap: 4,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: name,
            font: { size: density.name, weight: "bold" },
            textColor: theme.primary,
            maxLines: 1,
            minScale: 0.72,
            flex: 1,
          },
          {
            type: "text",
            text: rightMeta,
            font: { size: density.meta, weight: "semibold", family: "Menlo" },
            textColor: rightMetaColor,
            maxLines: 1,
            minScale: 0.8,
          },
        ],
      },
      {
        type: "stack",
        direction: "row",
        alignItems: "end",
        children: [
          {
            type: "text",
            text: remainingText,
            font: { size: density.remain, weight: "bold", family: "Menlo" },
            textColor: usageColor,
            maxLines: 1,
            minScale: 0.7,
          },
          {
            type: "spacer", length: 6 },
          {
            type: "text",
            text: "剩余",
            font: { size: density.sub, weight: "semibold" },
            textColor: theme.secondary,
            maxLines: 1,
          },
          { type: "spacer" },
          {
            type: "text",
            text: `${ratio.toFixed(1)}%`,
            font: { size: density.percent, weight: "bold", family: "Menlo" },
            textColor: usageColor,
            maxLines: 1,
          },
        ],
      },
      buildProgress(ratio, usageColor, theme, density),
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: `已用 ${usedText}`,
            font: { size: density.meta, weight: "medium", family: "Menlo" },
            textColor: theme.secondary,
            maxLines: 1,
            minScale: 0.8,
          },
          { type: "spacer" },
          {
            type: "text",
            text: `总量 ${totalText}`,
            font: { size: density.meta, weight: "medium", family: "Menlo" },
            textColor: theme.tertiary,
            maxLines: 1,
            minScale: 0.8,
          },
        ],
      },
    ],
  };
}

function buildProgress(percent, usageColor, theme, density) {
  const p = Math.max(0, Math.min(percent, 100));
  const fill = Math.max(0.08, p / 100);
  const rest = Math.max(0.08, 1 - fill);

  return {
    type: "stack",
    direction: "row",
    gap: 4,
    alignItems: "center",
    children: [
      {
        type: "stack",
        flex: fill,
        height: density.progress,
        backgroundGradient: {
          type: "linear",
          colors: [usageColor, theme.glow],
          stops: [0, 1],
          startPoint: { x: 0, y: 0.5 },
          endPoint: { x: 1, y: 0.5 },
        },
        borderRadius: 999,
        children: [],
      },
      {
        type: "stack",
        flex: rest,
        height: density.progress,
        backgroundColor: theme.faint,
        borderRadius: 999,
        children: [],
      },
    ],
  };
}

function pickUsageColor(percent, theme) {
  if (percent >= 90) return theme.danger;
  if (percent >= 70) return theme.warm;
  return theme.ok;
}

// ─── 网络请求 ─────────────────────────────────────────────────

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

// ─── 工具函数 ─────────────────────────────────────────────────

function bytesToSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
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
