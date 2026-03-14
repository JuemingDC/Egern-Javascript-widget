/**
 * ⛽ 全国实时油价小组件
 * 数据源：http://m.qiyoujiage.com/
 * 脚本作者：Egern 群友 tg://user?id=5122789128
 * 由 iBL3ND 二次修改,OLD M0N3Y_Chance:) 三次修改
 * 
 * 🔧 功能特性：
 * - 支持全国所有省份和城市
 * - 标题自动显示当前地区
 * - 调价信息右上角显示
 * - 实时显示 92/95/98 号汽油和柴油价格
 * - 更新深色背景，去除标签显示
 * - 全 iPhone 机型适配
 * 
 * 📚 使用教程
 * ═══════════════════════════════════════════════════
 *
 * 1️⃣ 环境变量配置
 * ─────────────────────────────────────────────────
 * 在 Egern 小组件配置中添加：
 *
 * 名称：region
 * 值：省份/城市（拼音，用 / 分隔）
 *
 * 名称：SHOW_TREND
 * 值：true（显示调价趋势）或 false（不显示）
 *
 *
 * 2️⃣ 地区代码对照表
 * ─────────────────────────────────────────────────
 * 【直辖市】
 * • 北京：beijing  • 上海：shanghai
 * • 天津：tianjin  • 重庆：chongqing
 *
 * 【省份 - 省会城市】
 * • 广东：guangdong/guangzhou
 * • 江苏：jiangsu/nanjing
 * • 浙江：zhejiang/hangzhou
 * • 山东：shandong/jinan
 * • 河南：henan/zhengzhou
 * • 河北：hebei/shijiazhuang
 * • 四川：sichuan/chengdu
 * • 湖北：hubei/wuhan
 * • 湖南：hunan/changsha
 * • 安徽：anhui/hefei
 * • 福建：fujian/fuzhou
 * • 江西：jiangxi/nanchang
 * • 辽宁：liaoning/shenyang
 * • 陕西：shanxi-3/xian  ⚠️
 * • 海南：hainan/haikou
 * • 山西：shanxi-1/taiyuan  ⚠️
 * • 吉林：jilin/changchun
 * • 黑龙江：heilongjiang/haerbin
 * • 云南：yunnan/kunming
 * • 贵州：guizhou/guiyang
 * • 广西：guangxi/nanning
 * • 甘肃：gansu/lanzhou
 * • 青海：qinghai/xining
 * • 宁夏：ningxia/yinchuan
 * • 新疆：xinjiang/wulumuqi
 * • 西藏：xizang/lasa
 * • 内蒙古：neimenggu/huhehaote
 *
 * ═══════════════════════════════════════════════════
 */

export default async function (ctx) {
 // 🔧 配置读取
 const regionParam = ctx.env.region || "hainan/haikou";
 const SHOW_TREND = (ctx.env.SHOW_TREND || "true").trim() !== "false";

 // 🔧 拼音转中文映射表
 const PINYIN_MAP = {
  "beijing": "北京", "shanghai": "上海", "tianjin": "天津", "chongqing": "重庆",
  "guangdong": "广东", "jiangsu": "江苏", "zhejiang": "浙江", "shandong": "山东",
  "henan": "河南", "hebei": "河北", "sichuan": "四川", "hubei": "湖北",
  "hunan": "湖南", "anhui": "安徽", "fujian": "福建", "jiangxi": "江西",
  "liaoning": "辽宁", "hainan": "海南", "jilin": "吉林",
  "heilongjiang": "黑龙江", "yunnan": "云南", "guizhou": "贵州",
  "guangxi": "广西", "gansu": "甘肃", "qinghai": "青海",
  "ningxia": "宁夏", "xinjiang": "新疆", "xizang": "西藏",
  "neimenggu": "内蒙古",
  "guangzhou": "广州", "nanjing": "南京", "hangzhou": "杭州", "jinan": "济南",
  "zhengzhou": "郑州", "shijiazhuang": "石家庄", "chengdu": "成都", "wuhan": "武汉",
  "changsha": "长沙", "hefei": "合肥", "fuzhou": "福州", "nanchang": "南昌",
  "shenyang": "沈阳", "haikou": "海口", "changchun": "长春",
  "haerbin": "哈尔滨", "kunming": "昆明", "guiyang": "贵阳",
  "nanning": "南宁", "lanzhou": "兰州", "xining": "西宁",
  "yinchuan": "银川", "wulumuqi": "乌鲁木齐", "lasa": "拉萨",
  "huhehaote": "呼和浩特", "xian": "西安", "taiyuan": "太原",
  "shanxi-1": "山西", "shanxi-3": "陕西",
 };

 // 🔧 解析地区名称
 const getRegionName = (region) => {
  if (!region) return "";
  const parts = region.split('/');
  let cityName = "";
  
  if (parts.length >= 2) {
   const provincePinyin = parts[0];
   const cityPinyin = parts[1];
   const provinceName = PINYIN_MAP[provincePinyin] || "";
   const cityNameFromMap = PINYIN_MAP[cityPinyin] || cityPinyin;
   
   if (["beijing", "shanghai", "tianjin", "chongqing"].includes(provincePinyin)) {
    cityName = cityNameFromMap || provinceName;
   } else {
    cityName = cityNameFromMap;
   }
  } else {
   cityName = PINYIN_MAP[region] || region;
  }
  return cityName;
 };

 const regionName = getRegionName(regionParam);
 const titleText = regionName ? `${regionName}实时油价` : "实时油价";

 // 🔧 解析调价趋势文本（提前解析，用于右上角显示）
 let trendDisplay = "";
 if (SHOW_TREND) {
  // 尝试从缓存读取趋势
  try {
   const cached = ctx.storage.getJSON(`qiyoujiage_oil_${regionParam}`);
   if (cached?.trendInfo) {
    trendDisplay = cached.trendInfo;
   }
  } catch(_) {}
 }

 const now = new Date();
 const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
 const refreshTime = new Date(Date.now() + 6*60*60*1000).toISOString();

 // 🎨 黑金版背景样式（深黑基底 + 琥珀金渐变，提升高级感与对比度）
 const backgroundGradient = {
  type: "linear",
  colors: ["#090807", "#15110D", "#241A10", "#120E0B"],
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 1, y: 1 }
 };

 const COLORS = {
  primary: "#FFF6E7",
  secondary: "rgba(255,244,225,0.82)",
  tertiary: "rgba(255,236,205,0.58)",
  gold: "#F5C76B",
  goldSoft: "rgba(245,199,107,0.18)",
  card: "rgba(255,255,255,0.03)",
  cardBorder: "rgba(245,199,107,0.10)",
  p92: "#FFBF47",
  p95: "#FF9658",
  p98: "#FF6F7D",
  diesel: "#4FE08B",
  trend: "#8CCBFF",
 };

 const CACHE_KEY = `qiyoujiage_oil_${regionParam}`;
 let prices = {p92:null, p95:null, p98:null, diesel:null};
 let trendInfo = trendDisplay;
 let hasCache = false;
 
 try {
  const cached = ctx.storage.getJSON(CACHE_KEY);
  if (cached && cached.prices) {
   prices = cached.prices;
   trendInfo = cached.trendInfo || "";
   hasCache = true;
  }
 } catch(_){}

 let fetchError = false;
 let errorMsg = "";

 try {
  const queryAddr = `http://m.qiyoujiage.com/${regionParam}.shtml`;
  
  const resp = await ctx.http.get(queryAddr, {
   headers: {
    'referer': 'http://m.qiyoujiage.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
   },
   timeout: 15000
  });
  
  if (resp.status !== 200) {
   throw new Error(`HTTP ${resp.status}: 页面不存在`);
  }
  
  const html = await resp.text();

  // 解析油价 - 方法1
  const regPrice = /<dl>[\s\S]+?<dt>(.*油)<\/dt>[\s\S]+?<dd>(.*)\(元\)<\/dd>/gm;
  const priceList1 = [];
  let m = null;
  
  while ((m = regPrice.exec(html)) !== null) {
   if (m.index === regPrice.lastIndex) regPrice.lastIndex++;
   priceList1.push({ name: m[1].trim(), value: m[2].trim() });
  }

  // 解析油价 - 方法2
  const dlBlocks = html.match(/<dl>[\s\S]+?<\/dl>/gi) || [];
  const priceList2 = [];
  
  for (const block of dlBlocks) {
   const dtMatch = block.match(/<dt[^>]*>([^<]+)<\/dt>/i);
   const ddMatch = block.match(/<dd[^>]*>([^<]+)<\/dd>/i);
   
   if (dtMatch && ddMatch) {
    const name = dtMatch[1].trim();
    const valueRaw = ddMatch[1].trim();
    const valueMatch = valueRaw.match(/([\d\.]+)/);
    if (valueMatch && name.includes('油')) {
     priceList2.push({ name, value: valueMatch[1] });
    }
   }
  }

  const priceList = priceList1.length >= priceList2.length ? priceList1 : priceList2;

  if (priceList.length >= 3) {
   const nameMap = { 
    "92号": "p92", "92 号": "p92", "92": "p92",
    "95号": "p95", "95 号": "p95", "95": "p95",
    "98号": "p98", "98 号": "p98", "98": "p98",
    "0号": "diesel", "0 号": "diesel", "柴油": "diesel"
   };
   
   prices = {p92:null, p95:null, p98:null, diesel:null};
   
   priceList.forEach(item => {
    const key = Object.keys(nameMap).find(k => item.name.includes(k));
    if (key) {
     const priceVal = parseFloat(item.value);
     if (!isNaN(priceVal)) {
      prices[nameMap[key]] = priceVal;
     }
    }
   });

   // 🔧 解析调价趋势（用于右上角显示）
   if (SHOW_TREND) {
    const regTrend = /<div class="tishi">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<br\/>([\s\S]+?)<br\/>/;
    const trendMatch = html.match(regTrend);
    
    if (trendMatch && trendMatch.length >= 3) {
     const datePart = trendMatch[1].split('价')[1]?.slice(0, -2) || "";
     const valuePart = trendMatch[2];
     const trend = (valuePart.includes('下调') || valuePart.includes('下跌')) ? '↓' : '↑';
     
     const amountMatch = valuePart.match(/([\d\.]+)元\/升[\s\S]*?([\d\.]+)元\/升/);
     const amount = amountMatch ? `${amountMatch[1]}-${amountMatch[2]}元` : 
                    (valuePart.match(/[\d\.]+元\/吨/)?.[0] || "");
     
     // 🔹 简洁格式，适合右上角显示
     trendInfo = `${datePart}${trend}${amount ? ` ${amount}` : ""}`;
     ctx.storage.setJSON(CACHE_KEY, { prices, trendInfo });
    }
   }

   fetchError = false;
  } else {
   if (!hasCache) {
    fetchError = true;
    errorMsg = `解析失败：${priceList.length} 个价格`;
   }
  }

 } catch (e) {
  if (!hasCache) {
   fetchError = true;
   errorMsg = e.message;
  }
 }

 const rows = [
  {label:"92 号", price:prices.p92, color:COLORS.p92},
  {label:"95 号", price:prices.p95, color:COLORS.p95},
  {label:"98 号", price:prices.p98, color:COLORS.p98},
  {label:"柴油", price:prices.diesel, color:COLORS.diesel},
 ].filter(r => r.price !== null);

 function priceCard(row){
  return {
   type:"stack",
   direction:"column",
   alignItems:"center",
   justifyContent:"center",
   flex:1,
   gap:3,
   padding:[10,4,10,4],
   children:[
    // 🏷️ 黑金版：去框但强化字号与颜色，让油品名更抓眼
    {
     type:"text",
     text:row.label,
     font:{size:"body",weight:"heavy"},
     textColor: row.color,
     textAlign:"center",
     lineLimit:1,
     minScale:0.75
    },
    {
     type:"text",
     text:row.price.toFixed(2),
     font:{size:"title2",weight:"bold"},
     textColor: COLORS.primary,
     textAlign:"center",
     lineLimit:1,
     minScale:0.68
    }
   ]
  }
 }

 return {
  type:"widget",
  padding:[11,10,11,10],
  gap:7,
  backgroundGradient: backgroundGradient,
  refreshAfter:refreshTime,
  children:[
   // 🔹 标题栏 + 右上角调价信息
   {
    type:"stack",
    direction:"row",
    alignItems:"center",
    gap:4,
    padding:[0,4,0,4],
    children:[
     {type:"image",src:"sf-symbol:fuelpump.fill",width:14,height:14,color:COLORS.gold},
     {type:"text",text:titleText,font:{size:"caption1",weight:"bold"},textColor:COLORS.primary,minScale:0.82},
     {type:"spacer"},
     // 🔹 右上角调价信息（蓝色小字）
     ...(SHOW_TREND && trendInfo ? [{
      type:"text",
      text:`📊 ${trendInfo}`,
      font:{size:"caption2",weight:"medium"},
      textColor: COLORS.trend,
      textAlign:"right",
      lineLimit:1
     }] : []),
     // 🔹 错误信息
     ...(fetchError ? [{
      type:"text",text:errorMsg,font:{size:"caption2"},textColor:COLORS.p98
     }] : [])
    ].filter(Boolean)
   },
   // 🔹 价格卡片
   rows.length > 0 ? {
    type:"stack",
    direction:"row",
    alignItems:"center",
    justifyContent:"space-between",
    gap:8,
    padding:[10,6,10,6],
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    children: rows.map(priceCard)
   } : {
    type:"stack",
    direction:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:[20,10,20,10],
    children:[
     {type:"image",src:"sf-symbol:exclamationmark.triangle.fill",width:24,height:24,color:COLORS.p98},
     {type:"text",text:fetchError?"数据获取失败":"暂无数据",font:{size:"body"},textColor:COLORS.secondary}
    ]
   },
   // 🔹 底部更新时间
   {
    type:"stack",
    direction:"row",
    alignItems:"center",
    padding:[0,4,0,4],
    children:[
     {type:"text",text:`${timeStr} 更新`,font:{size:"caption2",weight:"medium"},textColor:COLORS.tertiary},
     {type:"spacer"},
     {type:"text",text:"元/升",font:{size:"caption2"},textColor:COLORS.tertiary}
    ]
   }
  ]
 }
}

