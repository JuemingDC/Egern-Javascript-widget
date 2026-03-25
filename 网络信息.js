/**
 * ==========================================
 * 代码名称: 实时网络信息面板（流沙金版）
 * 说明:
 * 1. 去掉多余框线，改为一体式信息排布
 * 2. 保持原有数据逻辑基本不变
 * 3. 视觉风格统一为暖米色 / 流沙金 / 奶油金
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

  const ellipsize = (text, n = 26) => {
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
    const netType = isWifi ? "无线局域网" : "蜂窝网络";
    const accessName = wifiSsid || getRadioType(cellularRadio) || "未连接";
    const title = `${fmtISP(rawISP)} · ${accessName}`;

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

    const routeText =
      internalIP && gatewayIP && gatewayIP !== internalIP
        ? `${internalIP} → ${gatewayIP}`
        : internalIP || gatewayIP || "未连接";

    const infoCell = (label, value, accent, align = "left") => ({
      type: "stack",
      direction: "column",
      gap: 2,
      flex: 1,
      children: [
        {
          type: "text",
          text: label,
          font: { size: 11, weight: "semibold" },
          textColor: accent,
          textAlign: align,
          maxLines: 1
        },
        {
          type: "text",
          text: value || "—",
          font: { size: 15, weight: "bold" },
          textColor: { light: "#544535", dark: "#F2E3C8" },
          textAlign: align,
          maxLines: 1,
          minScale: 0.65
        }
      ]
    });

    const metaCell = (label, value) => ({
      type: "stack",
      direction: "column",
      gap: 1,
      flex: 1,
      children: [
        {
          type: "text",
          text: label,
          font: { size: 10, weight: "medium" },
          textColor: { light: "#B2966E", dark: "#C9AE85" },
          maxLines: 1
        },
        {
          type: "text",
          text: value || "—",
          font: { size: 12, weight: "medium" },
          textColor: { light: "#6F5A42", dark: "#E3D0B1" },
          maxLines: 1,
          minScale: 0.7
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
          { light: "#F2E8DA", dark: "#34281D" },
          { light: "#EADCC8", dark: "#3D2F22" }
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
                  font: { size: 17, weight: "heavy" },
                  textColor: { light: "#3D3023", dark: "#F5E8D2" },
                  maxLines: 1,
                  minScale: 0.68
                },
                {
                  type: "text",
                  text: "Network Overview",
                  font: { size: 11, weight: "medium" },
                  textColor: { light: "#A88B66", dark: "#C7AE87" },
                  maxLines: 1
                }
              ]
            },
            {
              type: "stack",
              direction: "row",
              alignItems: "center",
              gap: 4,
              padding: [5, 9, 5, 9],
              backgroundColor: { light: "rgba(255,255,255,0.28)", dark: "rgba(255,255,255,0.08)" },
              cornerRadius: 999,
              children: [
                {
                  type: "image",
                  src: isWifi
                    ? "sf-symbol:wifi"
                    : cellularRadio
                    ? "sf-symbol:antenna.radiowaves.left.and.right"
                    : "sf-symbol:wifi.slash",
                  color: { light: "#C79B4D", dark: "#E3C07A" },
                  width: 11,
                  height: 11
                },
                {
                  type: "text",
                  text: netType,
                  font: { size: 11, weight: "bold" },
                  textColor: { light: "#8C6A3E", dark: "#D7B988" },
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
          gap: 10,
          children: [
            {
              type: "stack",
              direction: "row",
              gap: 12,
              children: [
                infoCell("内网地址", ellipsize(routeText, 24), { light: "#C79B4D", dark: "#E2BC74" }, "left"),
                infoCell("出口节点", ellipsize(nodeIP, 20), { light: "#A9792F", dark: "#D7AB63" }, "right")
              ]
            },
            {
              type: "stack",
              height: 1,
              backgroundColor: { light: "rgba(180,145,93,0.18)", dark: "rgba(214,182,130,0.16)" }
            },
            {
              type: "stack",
              direction: "row",
              gap: 12,
              children: [
                infoCell("本地归属", ellipsize(localRegion, 18), { light: "#BC9350", dark: "#E0BA7B" }, "left"),
                infoCell("线路属性", `${nativeText} · ${riskText}`, { light: "#B88334", dark: "#E2B86B" }, "right")
              ]
            }
          ]
        },

        { type: "spacer", length: 10 },

        {
          type: "stack",
          padding: [8, 10, 8, 10],
          backgroundColor: { light: "rgba(255,255,255,0.16)", dark: "rgba(255,255,255,0.05)" },
          cornerRadius: 12,
          children: [
            {
              type: "stack",
              direction: "row",
              gap: 10,
              children: [
                metaCell("本地 IP", localIP),
                metaCell("节点地区", ellipsize(nodeRegion, 16)),
                metaCell("接入网络", accessName)
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
          { light: "#F2E8DA", dark: "#34281D" },
          { light: "#EADCC8", dark: "#3D2F22" }
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