/**
 * ==========================================
 * 实时网络信息面板（流沙金·表格式高密度版）
 * 设计目标：
 * 1. 左侧固定字段名，右侧显示对应值
 * 2. 信息排列更整齐
 * 3. 保证完整信息显示，提升信息密度
 * 4. 保持原始数据逻辑基本不变
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

  const clip = (text, n = 34) => {
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
        ? `${internalIP} / ${gatewayIP}`
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

    const LABEL = { light: "#A88554", dark: "#D0B184" };
    const TEXT = { light: "#433222", dark: "#F3E4CB" };
    const SUB = { light: "#8D724E", dark: "#D5B98B" };
    const LINE = { light: "rgba(170,132,84,0.16)", dark: "rgba(213,185,139,0.14)" };
    const BADGE_BG = { light: "rgba(255,255,255,0.18)", dark: "rgba(255,255,255,0.06)" };

    const row = (name, value, strong = false) => ({
      type: "stack",
      direction: "row",
      alignItems: "center",
      gap: 8,
      children: [
        {
          type: "text",
          text: name,
          width: 54,
          font: { size: 11, weight: "semibold" },
          textColor: LABEL,
          textAlign: "left",
          maxLines: 1
        },
        {
          type: "text",
          text: value || "—",
          flex: 1,
          font: { size: strong ? 13 : 12, weight: strong ? "bold" : "medium" },
          textColor: TEXT,
          textAlign: "left",
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
        locations: [0, 0.58, 1],
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
                  text: "网络信息",
                  font: { size: 10, weight: "medium" },
                  textColor: SUB,
                  maxLines: 1
                }
              ]
            },
            {
              type: "stack",
              padding: [4, 9, 4, 9],
              cornerRadius: 999,
              backgroundColor: BADGE_BG,
              children: [
                {
                  type: "text",
                  text: accessType,
                  font: { size: 10, weight: "bold" },
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
          gap: 7,
          children: [
            row("内网地址", clip(routeText, 36), true),
            { type: "stack", height: 1, backgroundColor: LINE },

            row("本地 IP", clip(localIP, 36), true),
            { type: "stack", height: 1, backgroundColor: LINE },

            row("出口节点", clip(nodeIP, 36), true),
            { type: "stack", height: 1, backgroundColor: LINE },

            row("节点地区", clip(nodeRegion, 36), false)
          ]
        },

        { type: "spacer", length: 8 },

        {
          type: "stack",
          height: 1,
          backgroundColor: LINE
        },

        { type: "spacer", length: 6 },

        {
          type: "stack",
          direction: "column",
          gap: 4,
          children: [
            row("本地归属", clip(localRegion, 36), false),
            row("线路属性", clip(nativeText, 36), false),
            row("风险等级", clip(riskText, 36), false)
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
        locations: [0, 0.58, 1],
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