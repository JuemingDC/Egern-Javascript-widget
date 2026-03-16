// 机场订阅流量面板 · Tech Liquid Glass Rebuild
// 说明：
// 1) 保留原环境变量：NAME1/URL1/RESET1 ... NAME5/URL5/RESET5
// 2) 保留原数据获取逻辑，不改订阅解析方式
// 3) 重构布局：左侧机场名称，右侧科技进度条 + 上下信息
// 4) 白天 / 夜晚自动切换配色
// 5) 多订阅时自动缩放字号、间距与左右占比，减少无效留白

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
        buildHeader(timeStr, density, theme),
        {
          type: "text",
          text: "请先配置 URL1 环境变量",
          font: { size: density.emptyTitleSize, weight: "semibold" },
          textColor: theme.warn,
          textAlign: "center",
        },
        {
          type: "text",
          text: "支持最多 5 个机场订阅，自动紧凑排版。",
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

  return {
    type: "widget",
    padding: density.padding,
    gap: density.sectionGap,
    backgroundGradient: theme.backgroundGradient,
    refreshAfter: refreshTime,
    children: [
      buildHeader(timeStr, density, theme),
      {
        type: "stack",
        direction: "column",
        gap: density.rowGap,
        children: results.map((item, idx) => buildRow(item, idx, density, theme)),
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
        c("#F6FBFF", "#06111E"),
        c("#EDF5FF", "#0A1B31"),
        c("#E5F0FF", "#102849"),
        c("#F8FBFF", "#0A1322"),
      ],
      stops: [0, 0.28, 0.72, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    title: c("#1B2A43", "#EFF6FF"),
    primary: c("#223552", "#EAF4FF"),
    secondary: c("#5E7698", "#A6C1E6"),
    tertiary: c("rgba(86,110,140,0.82)", "rgba(174,198,228,0.74)"),
    faint: c("rgba(94,118,152,0.18)", "rgba(183,208,243,0.12)"),
    rail: c("rgba(133,167,211,0.20)", "rgba(174,205,248,0.14)"),
    glow: c("rgba(88,156,255,0.22)", "rgba(121,192,255,0.16)"),
    accent: c("#317CFF", "#82C9FF"),
    ok: c("#19B874", "#72E6B4"),
    warm: c("#D38C1B", "#FFC86E"),
    danger: c("#D84C5A", "#FF9DA7"),
    warn: c("#DB644D", "#FFB5A6"),
  };
}

function getDensity(count) {
  if (count <= 1) {
    return {
      padding: [12, 15, 11, 15],
      sectionGap: 7,
      rowGap: 8,
      headerTitle: 10,
      headerMeta: 10,
      leftName: 18,
      topMeta: 10,
      remain: 22,
      remainUnit: 10,
      percent: 12,
      progress: 7,
      leftWidth: 0.31,
      emptyTitleSize: 14,
      emptySubSize: 11,
    };
  }
  if (count === 2) {
    return {
      padding: [11, 14, 10, 14],
      sectionGap: 6,
      rowGap: 6,
      headerTitle: 10,
      headerMeta: 10,
      leftName: 16,
      topMeta: 9,
      remain: 20,
      remainUnit: 10,
      percent: 11,
      progress: 6,
      leftWidth: 0.29,
      emptyTitleSize: 14,
      emptySubSize: 11,
    };
  }
  if (count <= 4) {
    return {
      padding: [10, 13, 10, 13],
      sectionGap: 6,
      rowGap: 5,
      headerTitle: 10,
      headerMeta: 9,
      leftName: 14,
      topMeta: 8,
      remain: 17,
      remainUnit: 9,
      percent: 10,
      progress: 5,
      leftWidth: 0.27,
      emptyTitleSize: 13,
      emptySubSize: 10,
    };
  }
  return {
    padding: [10, 12, 9, 12],
    sectionGap: 6,
    rowGap: 4,
    headerTitle: 9,
    headerMeta: 9,
    leftName: 13,
    topMeta: 8,
    remain: 15,
    remainUnit: 8,
    percent: 9,
    progress: 4,
    leftWidth: 0.25,
    emptyTitleSize: 13,
    emptySubSize: 10,
  };
}

function buildHeader(timeStr, density, theme) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 5,
        children: [
          {
            type: "image",
            src: "sf-symbol:antenna.radiowaves.left.and.right",
            width: density.headerTitle + 2,
            height: density.headerTitle + 2,
            color: theme.secondary,
          },
          {
            type: "text",
            text: "机场订阅",
            font: { size: density.headerTitle, weight: "semibold" },
            textColor: theme.secondary,
            maxLines: 1,
          },
        ],
      },
      { type: "spacer" },
      {
        type: "text",
        text: timeStr,
        font: { size: density.headerMeta, weight: "medium", family: "Menlo" },
        textColor: theme.tertiary,
      },
    ],
  };
}

function buildRow(result, idx, density, theme) {
  const { name, error, used, totalBytes, percent, expire, remainDays } = result;

  if (error) {
    return {
      type: "stack",
      direction: "row",
      gap: 10,
      alignItems: "center",
      children: [
        {
          type: "stack",
          flex: density.leftWidth,
          justifyContent: "center",
          children: [
            {
              type: "text",
              text: name,
              font: { size: density.leftName, weight: "bold" },
              textColor: theme.primary,
              maxLines: 2,
              minScale: 0.7,
            },
          ],
        },
        {
          type: "stack",
          flex: 1 - density.leftWidth,
          gap: 4,
          children: [
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                {
                  type: "text",
                  text: "订阅异常",
                  font: { size: density.topMeta, weight: "semibold", family: "Menlo" },
                  textColor: theme.danger,
                  maxLines: 1,
                },
                { type: "spacer" },
                {
                  type: "text",
                  text: "获取失败",
                  font: { size: density.topMeta, weight: "semibold", family: "Menlo" },
                  textColor: theme.danger,
                  maxLines: 1,
                },
              ],
            },
            buildRail(0.08, theme.danger, theme, density, true),
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              children: [
                {
                  type: "text",
                  text: "检查订阅链接",
                  font: { size: density.topMeta, weight: "medium" },
                  textColor: theme.secondary,
                  maxLines: 1,
                  minScale: 0.72,
                },
                { type: "spacer" },
                {
                  type: "text",
                  text: "缺少 subscription-userinfo",
                  font: { size: density.topMeta, weight: "medium", family: "Menlo" },
                  textColor: theme.tertiary,
                  maxLines: 1,
                  minScale: 0.65,
                },
              ],
            },
          ],
        },
      ],
    };
  }

  const remainingBytes = Math.max(0, totalBytes - used);
  const remainingText = bytesToSize(remainingBytes);
  const totalText = bytesToSize(totalBytes);
  const usedText = bytesToSize(used);
  const ratio = Math.min(Math.max(percent, 0), 100);
  const remainRatio = 100 - ratio;
  const stage = getStage(remainRatio, theme);

  let cycleText = "流量周期中";
  let cycleColor = theme.tertiary;

  if (expire) {
    const daysLeft = Math.ceil((expire * 1000 - Date.now()) / 86400000);
    if (daysLeft < 0) {
      cycleText = "已到期";
      cycleColor = theme.danger;
    } else if (daysLeft <= 3) {
      cycleText = `${daysLeft}天到期`;
      cycleColor = theme.danger;
    } else if (daysLeft <= 10) {
      cycleText = `${daysLeft}天到期`;
      cycleColor = theme.warm;
    } else {
      cycleText = formatDate(expire);
      cycleColor = theme.secondary;
    }
  } else if (remainDays !== null) {
    cycleText = `${remainDays}天重置`;
    cycleColor = remainDays <= 3 ? theme.warm : theme.secondary;
  }

  return {
    type: "stack",
    direction: "row",
    gap: 10,
    alignItems: "center",
    children: [
      {
        type: "stack",
        flex: density.leftWidth,
        justifyContent: "center",
        children: [
          {
            type: "text",
            text: name,
            font: { size: density.leftName, weight: "bold" },
            textColor: theme.primary,
            maxLines: 2,
            minScale: 0.68,
          },
        ],
      },
      {
        type: "stack",
        flex: 1 - density.leftWidth,
        gap: 4,
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              {
                type: "text",
                text: `已用 ${usedText}`,
                font: { size: density.topMeta, weight: "medium", family: "Menlo" },
                textColor: theme.secondary,
                maxLines: 1,
                minScale: 0.76,
              },
              { type: "spacer" },
              {
                type: "text",
                text: cycleText,
                font: { size: density.topMeta, weight: "semibold", family: "Menlo" },
                textColor: cycleColor,
                maxLines: 1,
                minScale: 0.76,
              },
            ],
          },
          buildRail(ratio / 100, stage.color, theme, density, false),
          {
            type: "stack",
            direction: "row",
            alignItems: "end",
            children: [
              {
                type: "text",
                text: remainingText,
                font: { size: density.remain, weight: "bold", family: "Menlo" },
                textColor: stage.color,
                maxLines: 1,
                minScale: 0.66,
              },
              { type: "spacer", length: 5 },
              {
                type: "text",
                text: "剩余",
                font: { size: density.remainUnit, weight: "semibold" },
                textColor: theme.secondary,
                maxLines: 1,
              },
              { type: "spacer" },
              {
                type: "stack",
                direction: "column",
                gap: 1,
                children: [
                  {
                    type: "text",
                    text: `${remainRatio.toFixed(1)}%`,
                    font: { size: density.percent, weight: "bold", family: "Menlo" },
                    textColor: stage.color,
                    textAlign: "right",
                    maxLines: 1,
                  },
                  {
                    type: "text",
                    text: `总量 ${totalText}`,
                    font: { size: density.topMeta, weight: "medium", family: "Menlo" },
                    textColor: theme.tertiary,
                    textAlign: "right",
                    maxLines: 1,
                    minScale: 0.74,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildRail(fillRatio, color, theme, density, isError) {
  const fill = Math.max(0.04, Math.min(fillRatio, 1));
  const rest = Math.max(0.02, 1 - fill);
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 5,
    children: [
      {
        type: "stack",
        width: density.progress + 2,
        height: density.progress + 2,
        borderRadius: 999,
        backgroundColor: color,
        children: [],
      },
      {
        type: "stack",
        flex: 1,
        height: density.progress,
        backgroundColor: theme.rail,
        borderRadius: 999,
        children: [
          {
            type: "stack",
            direction: "row",
            height: density.progress,
            children: [
              {
                type: "stack",
                flex: fill,
                height: density.progress,
                backgroundGradient: {
                  type: "linear",
                  colors: [color, c("rgba(255,255,255,0.78)", "rgba(255,255,255,0.32)"), color],
                  stops: [0, 0.55, 1],
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
                backgroundColor: isError ? theme.faint : c("rgba(148,176,214,0.10)", "rgba(174,205,248,0.08)"),
                borderRadius: 999,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

function getStage(remainingPercent, theme) {
  if (remainingPercent >= 45) return { color: theme.ok };
  if (remainingPercent >= 20) return { color: theme.warm };
  return { color: theme.danger };
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
