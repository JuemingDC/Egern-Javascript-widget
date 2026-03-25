/**
 * ==========================================
 * 代码名称: 实时网络信息面板（星空版）
 * 说明: 保持原有数据逻辑与主布局，仅重做背景与配色
 * ==========================================
 */

export default async function(ctx) {
  // ===== 星空主题色 =====
  const BG_COLORS = [
    { light: '#EEF3FF', dark: '#060814' },
    { light: '#DDE7FF', dark: '#0B1022' },
    { light: '#EDE4FF', dark: '#15112E' }
  ];

  const STAR_GLOW = { light: 'rgba(255,255,255,0.55)', dark: 'rgba(255,255,255,0.10)' };
  const CARD_BG = { light: 'rgba(255,255,255,0.58)', dark: 'rgba(255,255,255,0.06)' };
  const CARD_BORDER = { light: 'rgba(255,255,255,0.78)', dark: 'rgba(255,255,255,0.09)' };

  const TEXT_MAIN = { light: '#13203D', dark: '#F5F7FF' };
  const TEXT_SUB = { light: '#40506F', dark: '#CCD6F6' };
  const TEXT_MUTED = { light: '#6D7C9D', dark: '#93A3C8' };

  const COLOR_INTERNAL = { light: '#4DD0A8', dark: '#63F0C3' }; // 内网：星际薄荷绿
  const COLOR_LOCAL    = { light: '#5B8CFF', dark: '#7EB2FF' }; // 本地：星蓝
  const COLOR_NODE     = { light: '#9A6BFF', dark: '#BC9CFF' }; // 节点：星云紫
  const COLOR_ATTR     = { light: '#D6A63A', dark: '#FFD36B' }; // 属性：星砂金
  const COLOR_MODE     = { light: '#7B61FF', dark: '#A58BFF' }; // 状态：霓紫

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
    if (!isp) return "未知";
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
      "GPRS": "2.5G",
      "EDGE": "2.75G",
      "WCDMA": "3G",
      "LTE": "4G",
      "NR": "5G",
      "NRNSA": "5G"
    };
    return map[radio?.toUpperCase().replace(/\s+/g, "")] || radio || "";
  };

  try {
    const d = ctx.device || {};
    const [internalIP, gatewayIP, wifiSsid, cellularRadio] = [
      d.ipv4?.address,
      d.ipv4?.gateway,
      d.wifi?.ssid,
      d.cellular?.radio
    ];

    const [localInfo, nodeInfo, pureInfo] = await Promise.all([
      http.get('https://myip.ipip.net/json').catch(() => ({})),
      http.get('http://ip-api.com/json/?lang=zh-CN').catch(() => ({})),
      http.get('https://my.ippure.com/v1/info').catch(() => ({}))
    ]);

    let rawISP =
      (Array.isArray(localInfo.location) ? localInfo.location[localInfo.location.length - 1] : "") ||
      nodeInfo?.isp ||
      nodeInfo?.org;

    const isWifi = !!wifiSsid;
    let mainTitle = `${fmtISP(rawISP)} · ${wifiSsid || getRadioType(cellularRadio) || "未连接"}`;

    let r1Content = internalIP || "未连接";
    if (gatewayIP && gatewayIP !== internalIP) r1Content += ` / ${gatewayIP}`;

    let r2Content = localInfo.ip || "获取中...";
    const locStr = Array.isArray(localInfo.location)
      ? localInfo.location.slice(0, 3).join('').trim()
      : '';
    if (locStr) r2Content += ` / ${locStr}`;

    const nodeIP = nodeInfo.query || nodeInfo.ip || "获取中...";
    let r3Content = nodeIP;
    const nodeLoc = `${nodeInfo.country || ''} ${nodeInfo.city || ''}`.trim();
    if (nodeLoc) r3Content += ` / ${nodeLoc}`;

    const nativeText =
      pureInfo.isResidential === true
        ? "原生住宅"
        : (pureInfo.isResidential === false ? "商业机房" : "未知属性");

    const risk = pureInfo.fraudScore;
    let riskTxt = "未知风险";
    if (risk !== undefined) {
      if (risk >= 80) riskTxt = `极高危(${risk})`;
      else if (risk >= 70) riskTxt = `高危(${risk})`;
      else if (risk >= 40) riskTxt = `中危(${risk})`;
      else riskTxt = `低危纯净(${risk})`;
    }

    const r4Content = `${nativeText} / ${riskTxt}`;

    const buildRow = (icon, color, label, content) => ({
      type: 'stack',
      direction: 'row',
      alignItems: 'center',
      gap: 8,
      padding: [8, 10, 8, 10],
      backgroundColor: CARD_BG,
      borderColor: CARD_BORDER,
      borderWidth: 1,
      cornerRadius: 13,
      children: [
        {
          type: 'stack',
          direction: 'row',
          alignItems: 'center',
          gap: 4,
          width: 52,
          children: [
            { type: 'image', src: `sf-symbol:${icon}`, color, width: 13, height: 13 },
            {
              type: 'text',
              text: label,
              font: { size: 13, weight: 'heavy' },
              textColor: color,
              maxLines: 1
            }
          ]
        },
        {
          type: 'text',
          text: content,
          font: { size: 13, weight: 'medium' },
          textColor: TEXT_SUB,
          maxLines: 2,
          flex: 1
        }
      ]
    });

    return {
      type: 'widget',
      padding: 12,
      backgroundGradient: {
        type: 'linear',
        colors: BG_COLORS,
        locations: [0, 0.55, 1],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        // 顶部微星点
        {
          type: 'stack',
          direction: 'row',
          children: [
            {
              type: 'stack',
              width: 4,
              height: 4,
              cornerRadius: 2,
              backgroundColor: STAR_GLOW
            },
            { type: 'spacer' },
            {
              type: 'stack',
              width: 3,
              height: 3,
              cornerRadius: 1.5,
              backgroundColor: STAR_GLOW
            },
            { type: 'spacer', length: 18 },
            {
              type: 'stack',
              width: 2,
              height: 2,
              cornerRadius: 1,
              backgroundColor: STAR_GLOW
            }
          ]
        },

        { type: 'spacer', length: 4 },

        {
          type: 'stack',
          direction: 'row',
          alignItems: 'center',
          gap: 8,
          children: [
            {
              type: 'stack',
              width: 28,
              height: 28,
              cornerRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: CARD_BG,
              borderColor: CARD_BORDER,
              borderWidth: 1,
              children: [
                {
                  type: 'image',
                  src: isWifi
                    ? 'sf-symbol:wifi'
                    : (cellularRadio
                        ? 'sf-symbol:antenna.radiowaves.left.and.right'
                        : 'sf-symbol:wifi.slash'),
                  color: TEXT_MAIN,
                  width: 15,
                  height: 15
                }
              ]
            },
            {
              type: 'stack',
              direction: 'column',
              flex: 1,
              gap: 1,
              children: [
                {
                  type: 'text',
                  text: mainTitle,
                  font: { size: 15, weight: 'heavy' },
                  textColor: TEXT_MAIN,
                  maxLines: 1,
                  minScale: 0.7
                },
                {
                  type: 'text',
                  text: 'Stellar Network Info',
                  font: { size: 11, weight: 'medium' },
                  textColor: TEXT_MUTED,
                  maxLines: 1
                }
              ]
            },
            {
              type: 'stack',
              direction: 'row',
              alignItems: 'center',
              gap: 4,
              padding: [5, 8, 5, 8],
              backgroundColor: CARD_BG,
              borderColor: CARD_BORDER,
              borderWidth: 1,
              cornerRadius: 999,
              children: [
                {
                  type: 'image',
                  src: 'sf-symbol:sparkles',
                  color: COLOR_MODE,
                  width: 10,
                  height: 10
                },
                {
                  type: 'text',
                  text: isWifi ? '无线局域网' : '蜂窝网络',
                  font: { size: 11, weight: 'bold' },
                  textColor: TEXT_MUTED
                }
              ]
            }
          ]
        },

        { type: 'spacer', length: 12 },

        {
          type: 'stack',
          direction: 'column',
          gap: 8,
          children: [
            buildRow('house.fill', COLOR_INTERNAL, '内网', r1Content),
            buildRow('location.circle.fill', COLOR_LOCAL, '本地', r2Content),
            buildRow('network', COLOR_NODE, '节点', r3Content),
            buildRow('shield.lefthalf.filled', COLOR_ATTR, '属性', r4Content)
          ]
        },

        { type: 'spacer' },

        // 底部微星点
        {
          type: 'stack',
          direction: 'row',
          children: [
            {
              type: 'stack',
              width: 2,
              height: 2,
              cornerRadius: 1,
              backgroundColor: STAR_GLOW
            },
            { type: 'spacer', length: 24 },
            {
              type: 'stack',
              width: 3,
              height: 3,
              cornerRadius: 1.5,
              backgroundColor: STAR_GLOW
            },
            { type: 'spacer' },
            {
              type: 'stack',
              width: 2,
              height: 2,
              cornerRadius: 1,
              backgroundColor: STAR_GLOW
            }
          ]
        }
      ]
    };
  } catch (err) {
    return {
      type: 'widget',
      padding: 12,
      backgroundGradient: {
        type: 'linear',
        colors: BG_COLORS,
        locations: [0, 0.55, 1],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 }
      },
      children: [
        {
          type: 'stack',
          padding: [10, 12, 10, 12],
          backgroundColor: CARD_BG,
          borderColor: CARD_BORDER,
          borderWidth: 1,
          cornerRadius: 13,
          children: [
            {
              type: 'text',
              text: '刷新中...',
              font: { size: 13, weight: 'medium' },
              textColor: TEXT_MUTED
            }
          ]
        }
      ]
    };
  }
}