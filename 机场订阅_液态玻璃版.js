// 机场订阅小组件 · 液态玻璃版
// 环境变量：NAME1/URL1/RESET1 ... NAME5/URL5/RESET5
// 设计调整：
// 1) 去掉所有卡片框、边框、胶囊底
// 2) 机场之间只保留一条渐变分割线
// 3) 提高文字对比度，整体更轻、更像液态玻璃层

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

  const bgGradient = {
    type: "linear",
    colors: ["#111827", "#1B2A45", "#21365A", "#151C2F"],
    stops: [0, 0.35, 0.72, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };

  if (!slots.length) {
    return {
      type: "widget",
      padding: [16, 16, 14, 16],
      gap: 10,
      backgroundGradient: bgGradient,
      refreshAfter: refreshTime,
      children: [
        buildHeader(timeStr),
        { type: "spacer", length: 8 },
        {
          type: "text",
          text: "请配置 URL1 环境变量",
          font: { size: "caption1", weight: "semibold" },
          textColor: "#FFD5D0",
          textAlign: "center",
        },
      ],
    };
  }

  const results = await Promise.all(slots.map((s) => fetchInfo(ctx, s)));

  const listChildren = [];
  results.forEach((r, idx) => {
    listChildren.push(buildRow(r));
    if (idx !== results.length - 1) {
      listChildren.push(buildDivider());
    }
  });

  return {
    type: "widget",
    padding: [14, 16, 12, 16],
    gap: 10,
    backgroundGradient: bgGradient,
    refreshAfter: refreshTime,
    children: [
      buildHeader(timeStr),
      {
        type: "stack",
        direction: "column",
        gap: 8,
        children: listChildren,
      },
    ],
  };
}

function buildHeader(timeStr) {
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
            src: "sf-symbol:chart.bar.fill",
            width: 13,
            height: 13,
            color: "#B5C7FF",
          },
          {
            type: "text",
            text: "订阅流量",
            font: { size: "caption1", weight: "semibold" },
            textColor: "#E8EEFF",
          },
        ],
      },
      { type: "spacer" },
      {
        type: "text",
        text: timeStr,
        font: { size: "caption2", weight: "medium", family: "Menlo" },
        textColor: "#B9C5E3",
      },
    ],
  };
}

function buildDivider() {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "stack",
        flex: 1,
        height: 1,
        backgroundGradient: {
          type: "linear",
          colors: ["rgba(255,255,255,0)", "rgba(180,205,255,0.28)", "rgba(255,255,255,0)"],
          stops: [0, 0.5, 1],
          startPoint: { x: 0, y: 0.5 },
          endPoint: { x: 1, y: 0.5 },
        },
        children: [],
      },
    ],
  };
}

function buildRow(result) {
  const { name, error, used, totalBytes, percent, expire, remainDays } = result;

  const usageColor =
    error
      ? "#FF8F86"
      : percent >= 90
      ? "#FF8F86"
      : percent >= 70
      ? "#FFD36F"
      : "#7DE2B1";

  if (error) {
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      children: [
        {
          type: "stack",
          direction: "column",
          gap: 3,
          flex: 1,
          children: [
            {
              type: "text",
              text: name,
              font: { size: "body", weight: "semibold" },
              textColor: "#F2F6FF",
              maxLines: 1,
              minScale: 0.75,
            },
            {
              type: "text",
              text: "获取失败",
              font: { size: "caption2", weight: "medium" },
              textColor: "#FF8F86",
            },
          ],
        },
        {
          type: "image",
          src: "sf-symbol:exclamationmark.triangle.fill",
          width: 12,
          height: 12,
          color: "#FF8F86",
        },
      ],
    };
  }

  let expireText = "";
  let expireColor = "#A7B6D8";
  if (expire) {
    const daysLeft = Math.ceil((expire * 1000 - Date.now()) / 86400000);
    if (daysLeft < 0) {
      expireText = "已到期";
      expireColor = "#FF8F86";
    } else if (daysLeft <= 7) {
      expireText = `${daysLeft}天后到期`;
      expireColor = "#FFD36F";
    } else {
      expireText = formatDate(expire);
      expireColor = "#A7B6D8";
    }
  } else if (remainDays !== null) {
    expireText = `${remainDays}天重置`;
    expireColor = remainDays <= 3 ? "#FFD36F" : "#A7B6D8";
  }

  const barFilled = Math.round(Math.min(Math.max(percent, 0), 100) / 10);
  const barEmpty = 10 - barFilled;

  return {
    type: "stack",
    direction: "column",
    gap: 6,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: name,
            font: { size: "body", weight: "semibold" },
            textColor: "#F4F7FF",
            maxLines: 1,
            minScale: 0.75,
            flex: 1,
          },
          ...(expireText
            ? [
                {
                  type: "text",
                  text: expireText,
                  font: { size: "caption2", weight: "medium", family: "Menlo" },
                  textColor: expireColor,
                  maxLines: 1,
                  minScale: 0.8,
                },
              ]
            : []),
        ],
      },
      {
        type: "stack",
        direction: "row",
        gap: 3,
        alignItems: "center",
        children: [
          ...(barFilled > 0
            ? [
                {
                  type: "stack",
                  flex: barFilled,
                  height: 4,
                  backgroundColor: usageColor,
                  borderRadius: 99,
                  children: [],
                },
              ]
            : []),
          ...(barEmpty > 0
            ? [
                {
                  type: "stack",
                  flex: barEmpty,
                  height: 4,
                  backgroundColor: "rgba(255,255,255,0.10)",
                  borderRadius: 99,
                  children: [],
                },
              ]
            : []),
        ],
      },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: `${bytesToSize(used)} / ${bytesToSize(totalBytes)}`,
            font: { size: "caption2", weight: "medium", family: "Menlo" },
            textColor: "#C8D3EE",
            maxLines: 1,
            minScale: 0.8,
          },
          { type: "spacer" },
          {
            type: "text",
            text: `${percent.toFixed(1)}%`,
            font: { size: "caption1", weight: "semibold", family: "Menlo" },
            textColor: usageColor,
            maxLines: 1,
          },
        ],
      },
    ],
  };
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
