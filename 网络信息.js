/**
 * ==========================================
 * 实时网络信息面板（流沙金·整齐版）
 * 特点：
 * 1. 去掉零碎小框
 * 2. 改为严格两列网格 + 一行属性带
 * 3. 保持原始数据逻辑基本不变
 * ==========================================
 */

export default async function (ctx) {
  const http = {
    get: async (url) => {
      try {
        const resp = await ctx.http.get(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000
        });
        const text = await resp.text();
        return JSON.parse(text).data || JSON.parse(text);
      } catch (e) {
        return {};
      }
    }
  };

  const fmtISP = (isp) => {
    if (!isp) return "未知网络";
    const s = isp.toLowerCase();
    const raw = isp.replace(/\s*\(中国\)\s*/, "").replace(/\s+/g, " ").trim();
    if (/(^|[\s-])(cmcc|cmnet|cmi|mobile)\b|移动/.test(s)) return "中国移动";
    if (/(^|[\s-])(chinanet|telecom|ctcc|ct)\b|电信/.test(s)) return "中国电信";
    if (/(^|[\s-])(unicom|cncgroup|netcom|link)\b|联通/.test(s)) return "中国联通";
    if (/(^|[\s-])(cbn|broadcast)\b|广电/.test(s)) return "中国广电";
    return raw;
  };

  const getRadioType = (radio) => {
    const map = {
      GPRS: "2.5G",
      EDGE: "2.75G",
      WCDMA: "3G",
      LTE: "4G",
      NR: "5G",
      NRNSA: "5G"
    };
    return map[radio?.toUpperCase().replace(/\s+/g, "")] || radio || "";
  };

  const clip = (text, n = 22) => {
    if (!text) return "—";
    const s = String(text);
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  };

  try {
    const d = ctx.device || {};
    const internalIP = d.ipv4?.address || "";
    const gatewayIP = d.ipv4?.gateway || "";
    const wifiSsid = d.wifi?.ssid || "";
    const cellularRadio = d.cellular?.radio || "";

    const [localInfo, nodeInfo, pureInfo] = await Promise.all([
      http.get("https://myip.ipip.net/json").catch(() => ({})),
      http.get("http://ip-api.com/json/?lang=zh-CN").catch(() => ({})),
      http.get("https://my.ippure.com/v1/info").catch(() => ({}))
    ]);

    let rawISP =
      (Array.isArray(localInfo.location)
        ? localInfo.location[localInfo.location.length - 1]
        : "") ||
      nodeInfo?.isp ||
      nodeInfo?.org ||
      "";

    const isWifi = !!wifiSsid;
    const accessName = wifiSsid || getRadioType(cellularRadio) || "未连接";
    const accessType = isWifi ? "无线局域网" : "蜂窝网络";

    const title = `${fmtISP(rawISP)} · ${accessName}`;

    const routeText =
      internalIP && gatewayIP && gatewayIP !== internalIP
        ? `${internalIP} → ${gatewayIP}`
        : internalIP || gatewayIP || "未连接";

    const localIP = localInfo.ip || "获取中";
    const localRegion = Array.isArray(localInfo.location)
      ? localInfo.location.slice(0, 3).join("")
      : "定位中";

    const nodeIP = nodeInfo.query || nodeInfo.ip || "获取中";
    const nodeRegion = `${nodeInfo.country || ""} ${nodeInfo.city || ""}`.trim() || "定位中";

    const nativeText =
      pureInfo.isResidential === true
        ? "原生住宅"
        : pureInfo.isResidential === false
        ? "商业机房"
        : "未知属性";

    const risk = pureInfo.fraudScore;
    let riskText = "未知风险";
    if (risk !== undefined) {
      if (risk >= 80) riskText = `极高危 ${risk}`;
      else if (risk >= 70) riskText = `高危 ${risk}`;
      else if (risk >= 40) riskText = `中危 ${risk}`;
      else riskText = `低危 ${risk}`;
    }

    const LABEL = { light: "#B08D62", dark: "#D0B184" };
    const TEXT = { light: "#4B3B2A", dark: "#F2E3C8" };
    const SUB = { light: "#8F744F", dark: "#D6B98A" };
    const LINE = { light: "rgba(176,141,98,0.16)", dark: "rgba(214,185,138,0.14)" };

    const gridCell = (label, value, align = "left") => ({
      type: "stack",
      direction: "column",
      flex: 1,
      gap: 3,
      children: [
        {
          type: "text",
          text: label,
          font: { size: 10, weight: "semibold" },
          textColor: LABEL,
          textAlign: align,
          maxLines: 1
        },
        {
          type: "text",
          text: value || "—",
          font: { size: 14, weight: "bold" },
          textColor: TEXT,
          textAlign: align,
          maxLines: 1,
          minScale: 0.72
        }
      ]
    });

    return {
      type: "widget",
      padding: 14,
      backgroundGradient: {
        type: "linear",
        colors: [
          { light: "#F8F2E8", dark: "#2A2118" },
          { light: "#F3E8D8", dark: "#34281D" },
          { light: "#EBDCC8", dark: "#3D2F22" }
        ],
        locations: [0, 0.6, 1],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "stack",
              direction: "column",
              flex: 1,
              gap: 1,
              children: [
                {
                  type: "text",
                  text: title,
                  font: { size: 16, weight: "heavy" },
                  textColor: TEXT,
                  maxLines: 1,
                  minScale: 0.68
                },
                {
                  type: "text",
                  text: "网络总览",
                  font: { size: 11, weight: "medium" },
                  textColor: SUB,
                  maxLines: 1
                }
              ]
            },
            {
              type: "stack",
              padding: [5, 9, 5, 9],
              cornerRadius: 999,
              backgroundColor: { light: "rgba(255,255,255,0.18)", dark: "rgba(255,255,255,0.06)" },
              children: [
                {
                  type: "text",
                  text: accessType,
                  font: { size: 11, weight: "bold" },
                  textColor: LABEL,
                  maxLines: 1
                }
              ]
            }
          ]
        },

        { type: "spacer", length: 10 },

        {
          type: "stack",
          direction: "column",
          gap: 8,
          children: [
            {
              type: "stack",
              direction: "row",
              gap: 14,
              children: [
                gridCell("内网地址", clip(routeText, 22), "left"),
                gridCell("出口节点", clip(nodeIP, 20), "right")
              ]
            },
            {
              type: "stack",
              height: 1,
              backgroundColor: LINE
            },
            {
              type: "stack",
              direction: "row",
              gap: 14,
              children: [
                gridCell("本地 IP", clip(localIP, 20), "left"),
                gridCell("节点地区", clip(nodeRegion, 18), "right")
              ]
            }
          ]
        },

        { type: "spacer", length: 10 },

        {
          type: "stack",
          direction: "column",
          gap: 5,
          padding: [8, 0, 0, 0],
          children: [
            {
              type: "stack",
              height: 1,
              backgroundColor: LINE
            },
            {
              type: "stack",
              direction: "row",
              alignItems: "start",
              gap: 8,
              children: [
                {
                  type: "text",
                  text: "线路属性",
                  font: { size: 10, weight: "semibold" },
                  textColor: LABEL,
                  width: 52,
                  maxLines: 1
                },
                {
                  type: "text",
                  text: `${nativeText} · ${riskText} · ${localRegion}`,
                  font: { size: 12, weight: "medium" },
                  textColor: TEXT,
                  flex: 1,
                  maxLines: 2,
                  minScale: 0.78
                }
              ]
            }
          ]
        }
      ]
    };
  } catch (err) {
    return {
      type: "widget",
      padding: 14,
      backgroundGradient: {
        type: "linear",
        colors: [
          { light: "#F8F2E8", dark: "#2A2118" },
          { light: "#F3E8D8", dark: "#34281D" },
          { light: "#EBDCC8", dark: "#3D2F22" }
        ],
        locations: [0, 0.6, 1],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: "text",
          text: "网络信息加载中…",
          font: { size: 14, weight: "medium" },
          textColor: { light: "#8B6D49", dark: "#DABD90" }
        }
      ]
    };
  }
}
