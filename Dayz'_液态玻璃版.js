/**
 * 小日子（液态玻璃版）
 * 修改说明：
 * 1. 去掉所有徽章 / 胶囊 / 边框式背景
 * 2. 提升文字对比度，强化主信息可读性
 * 3. 背景改为更克制的液态玻璃渐变
 * 4. 保留原有农历与四类节日倒计时逻辑
 *
 * 基于用户上传脚本修改
 */

// ── 工具 ─────────────────────────────────────────────
function fmtYMD(y, m, d) { return y + "-" + m + "-" + d; }

function dateDiff(a, b) {
  var pa = a.split("-"), pb = b.split("-");
  return Math.round(
    (new Date(+pb[0], +pb[1]-1, +pb[2]) - new Date(+pa[0], +pa[1]-1, +pa[2]))
    / 86400000
  );
}

function nthWeekday(year, month, wd, n) {
  var d1 = new Date(year, month - 1, 1);
  return fmtYMD(year, month, 1 + ((wd - d1.getDay() + 7) % 7) + (n - 1) * 7);
}

// ── 农历算法 ──────────────────────────────────────────
var C = {
  li:[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520],
  sm:[31,28,31,30,31,30,31,31,30,31,30,31],
  G:["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"],
  Z:["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"],
  An:["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"],
  st:["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"],
  si:['9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c3598082c95f8c965cc920f','97bd0b06bdb0722c965ce1cfcc920f','b027097bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c359801ec95f8c965cc920f','97bd0b06bdb0722c965ce1cfcc920f','b027097bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c359801ec95f8c965cc920f','97bd0b06bdb0722c965ce1cfcc920f','b027097bd097c36b0b6fc9274c91aa','9778397bd19801ec9210c965cc920e','97b6b97bd19801ec95f8c965cc920f','97bd09801d98082c95f8e1cfcc920f','97bd097bd097c36b0b6fc9210c8dc2','9778397bd197c36c9210c9274c91aa','97b6b97bd19801ec95f8c965cc920e','97bd09801d98082c95f8e1cfcc920f','97bd097bd097c36b0b6fc9210c8dc2','9778397bd097c36c9210c9274c91aa','97b6b97bd19801ec95f8c965cc920e','97bcf97c3598082c95f8e1cfcc920f','97bd097bd097c36b0b6fc9210c8dc2','9778397bd097c36c9210c9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c3598082c95f8c965cc920f','97bd097bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c3598082c95f8c965cc920f','97bd097bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c359801ec95f8c965cc920f','97bd097bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf97c359801ec95f8c965cc920f','97bd097bd07f595b0b6fc920fb0722','9778397bd097c36b0b6fc9210c8dc2','9778397bd19801ec9210c9274c920e','97b6b97bd19801ec95f8c965cc920f','97bd07f5307f595b0b0bc920fb0722','7f0e397bd097c36b0b6fc9210c8dc2','9778397bd097c36c9210c9274c920e','97b6b97bd19801ec95f8c965cc920f','97bd07f5307f595b0b0bc920fb0722','7f0e397bd097c36b0b6fc9210c8dc2','9778397bd097c36c9210c9274c91aa','97b6b97bd19801ec9210c965cc920e','97bd07f1487f595b0b0bc920fb0722','7f0e397bd097c36b0b6fc9210c8dc2','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf7f1487f595b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf7f1487f595b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf7f1487f531b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c965cc920e','97bcf7f1487f531b0b0bb0b6fb0722','7f0e397bd07f595b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b97bd19801ec9210c9274c920e','97bcf7f0e47f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','9778397bd097c36b0b6fc9210c91aa','97b6b97bd197c36c9210c9274c920e','97bcf7f0e47f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','9778397bd097c36b0b6fc9210c8dc2','9778397bd097c36c9210c9274c920e','97b6b7f0e47f531b0723b0b6fb0722','7f0e37f5307f595b0b0bc920fb0722','7f0e397bd097c36b0b6fc9210c8dc2','9778397bd097c36b0b70c9274c91aa','97b6b7f0e47f531b0723b0b6fb0721','7f0e37f1487f595b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc9210c8dc2','9778397bd097c36b0b6fc9274c91aa','97b6b7f0e47f531b0723b0b6fb0721','7f0e27f1487f595b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','9778397bd097c36b0b6fc9274c91aa','97b6b7f0e47f531b0723b0787b0721','7f0e27f0e47f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','9778397bd097c36b0b6fc9210c91aa','97b6b7f0e47f149b0723b0787b0721','7f0e27f0e47f531b0723b0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','9778397bd097c36b0b6fc9210c8dc2','977837f0e37f149b0723b0787b0721','7f07e7f0e47f531b0723b0b6fb0722','7f0e37f5307f595b0b0bc920fb0722','7f0e397bd097c35b0b6fc9210c8dc2','977837f0e37f14998082b0787b0721','7f07e7f0e47f531b0723b0b6fb0721','7f0e37f1487f595b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc9210c8dc2','977837f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722','7f0e397bd097c35b0b6fc920fb0722','977837f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','977837f0e37f14998082b0787b06bd','7f07e7f0e47f149b0723b0787b0721','7f0e27f0e47f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','977837f0e37f14998082b0723b06bd','7f07e7f0e37f149b0723b0787b0721','7f0e27f0e47f531b0b0bb0b6fb0722','7f0e397bd07f595b0b0bc920fb0722','977837f0e37f14898082b0723b02d5','7ec967f0e37f14998082b0787b0721','7f07e7f0e47f531b0723b0b6fb0722','7f0e37f1487f595b0b0bb0b6fb0722','7f0e37f0e37f14898082b0723b02d5','7ec967f0e37f14998082b0787b0721','7f07e7f0e47f531b0723b0b6fb0722','7f0e37f1487f531b0b0bb0b6fb0722','7f0e37f0e37f14898082b0723b02d5','7ec967f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e37f1487f531b0b0bb0b6fb0722','7f0e37f0e37f14898082b072297c35','7ec967f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722','7f0e37f0e37f14898082b072297c35','7ec967f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722','7f0e37f0e366aa89801eb072297c35','7ec967f0e37f14998082b0723b06bd','7f07e7f0e37f14998083b0787b0721','7f0e27f0e47f531b0723b0b6fb0722','7f0e37f0e366aa89801eb072297c35','7ec967f0e37f14998082b0723b02d5','7f07e7f0e37f14998082b0787b0721','7f07e7f0e47f531b0723b0b6fb0722','7f0e36665b66aa89801e9808297c35','665f67f0e37f14898082b0723b02d5','7ec967f0e37f14998082b0787b0721','7f07e7f0e47f531b0723b0b6fb0722','7f0e36665b66a449801e9808297c35','665f67f0e37f14898082b0723b02d5','7ec967f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e36665b66a449801e9808297c35','665f67f0e37f14898082b072297c35','7ec967f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e26665b66a449801e9808297c35','665f67f0e37f1489801eb072297c35','7ec967f0e37f14998082b0787b06bd','7f07e7f0e47f531b0723b0b6fb0721','7f0e27f1487f531b0b0bb0b6fb0722'],
  n1:["日","一","二","三","四","五","六","七","八","九","十"],
  n2:["初","十","廿","卅"],
  n3:["正","二","三","四","五","六","七","八","九","十","冬","腊"],
  lYD:function(y){var s=348,i;for(i=0x8000;i>0x8;i>>=1)s+=((this.li[y-1900]&i)?1:0);return s+this.lD(y);},
  lM:function(y){return this.li[y-1900]&0xf;},
  lD:function(y){return this.lM(y)?((this.li[y-1900]&0x10000)?30:29):0;},
  mD:function(y,m){if(m>12||m<1)return -1;return(this.li[y-1900]&(0x10000>>m))?30:29;},
  GZ:function(o){return this.G[o%10]+this.Z[o%12];},
  gzY:function(y){var g=(y-3)%10,z=(y-3)%12;if(!g)g=10;if(!z)z=12;return this.G[g-1]+this.Z[z-1];},
  gT:function(y,n){
    if(y<1900||y>2100||n<1||n>24)return -1;
    var t=this.si[y-1900],d=[];
    for(var i=0;i<t.length;i+=5){var c=parseInt('0x'+t.substr(i,5)).toString();d.push(c[0],c.substr(1,2),c[3],c.substr(4,2));}
    return parseInt(d[n-1]);
  },
  cM:function(m){return(m<1||m>12)?"":this.n3[m-1]+"月";},
  cD:function(d){switch(d){case 10:return"初十";case 20:return"二十";case 30:return"三十";}return this.n2[Math.floor(d/10)]+this.n1[d%10];},
  ast:function(m,d){var s="摩羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯";var a=[20,19,21,21,21,22,23,23,23,23,22,22];return s.substr(m*2-(d<a[m-1]?2:0),2)+"座";},
  s2l:function(Y,M,D){
    var y=+Y,m=+M,d=+D;
    if(y<1900||y>2100)return null;
    var obj=new Date(y,m-1,d);
    y=obj.getFullYear();m=obj.getMonth()+1;d=obj.getDate();
    var off=Math.round((Date.UTC(y,m-1,d)-Date.UTC(1900,0,31))/86400000);
    var i,tmp=0;
    for(i=1900;i<2101&&off>0;i++){tmp=this.lYD(i);off-=tmp;}
    if(off<0){off+=tmp;i--;}
    var yr=i,lp=this.lM(i),il=false;
    for(i=1;i<13&&off>0;i++){
      if(lp>0&&i===(lp+1)&&!il){--i;il=true;tmp=this.lD(yr);}
      else tmp=this.mD(yr,i);
      if(il&&i===(lp+1))il=false;
      off-=tmp;
    }
    if(off===0&&lp>0&&i===lp+1){if(il)il=false;else{il=true;--i;}}
    if(off<0){off+=tmp;--i;}
    var mo=i,dy=off+1;
    var gY=this.gzY(yr);
    var fn=this.gT(y,m*2-1),sn=this.gT(y,m*2);
    var gM=this.GZ((y-1900)*12+m+11);
    if(d>=fn)gM=this.GZ((y-1900)*12+m+12);
    var Tm=null;
    if(fn===d)Tm=this.st[m*2-2];
    if(sn===d)Tm=this.st[m*2-1];
    var gD=this.GZ(Math.floor(Date.UTC(y,m-1,1)/86400000)+25567+10+d-1);
    return{lY:yr,lM:mo,lD:dy,ani:this.An[(yr-4)%12],
      iMon:(il?"闰":"")+this.cM(mo),iDay:this.cD(dy),
      cY:y,cM:m,cD:d,gY:gY,gM:gM,gD:gD,
      wk:obj.getDay(),isTerm:!!Tm,Term:Tm,astro:this.ast(m,d)};
  },
  l2s:function(y,m,d){
    y=+y;m=+m;d=+d;
    var day=this.mD(y,m);
    var _d=day;
    if(y<1900||y>2100||d>_d||d<1)return null;
    var off=0;
    for(var i=1900;i<y;i++)off+=this.lYD(i);
    var lp=0,ia=false;
    for(var j=1;j<m;j++){lp=this.lM(y);if(!ia&&lp<=j&&lp>0){off+=this.lD(y);ia=true;}off+=this.mD(y,j);}
    var cal=new Date((off+d-31)*86400000+Date.UTC(1900,1,30));
    return this.s2l(cal.getUTCFullYear(),cal.getUTCMonth()+1,cal.getUTCDate());
  }
};

// ── 节日列表 ──────────────────────────────────────────
function ls(y,lm,ld){var r=C.l2s(y,lm,ld);return r?r.cY+"-"+r.cM+"-"+r.cD:null;}

function termList(year){
  var out=[];
  for(var i=1;i<=24;i++){
    var mo=i<=2?1:i<=4?2:i<=6?3:i<=8?4:i<=10?5:i<=12?6:i<=14?7:i<=16?8:i<=18?9:i<=20?10:i<=22?11:12;
    var d=C.gT(year,i);
    if(d>0)out.push([C.st[i-1],fmtYMD(year,mo,d)]);
  }
  return out.sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}
function legalList(year){
  var t7=C.gT(year,7);
  return [["元旦",fmtYMD(year,1,1)],["春节",ls(year,1,1)],
    ["清明节",t7>0?fmtYMD(year,4,t7):null],["劳动节",fmtYMD(year,5,1)],
    ["端午节",ls(year,5,5)],["中秋节",ls(year,8,15)],["国庆节",fmtYMD(year,10,1)]
  ].filter(function(x){return x[1];}).sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}
function folkList(year){
  var d12=C.mD(year,12);
  return [["除夕",ls(year,12,d12===29?29:30)],["元宵节",ls(year,1,15)],
    ["龙抬头",ls(year,2,2)],["七夕节",ls(year,7,7)],["中元节",ls(year,7,15)],
    ["重阳节",ls(year,9,9)],["腊八节",ls(year,12,8)],["小年(北)",ls(year,12,23)]
  ].filter(function(x){return x[1];}).sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}
function intlList(year){
  return [["情人节",fmtYMD(year,2,14)],["母亲节",nthWeekday(year,5,0,2)],
    ["父亲节",nthWeekday(year,6,0,3)],["万圣节",fmtYMD(year,10,31)],
    ["平安夜",fmtYMD(year,12,24)],["圣诞节",fmtYMD(year,12,25)],
    ["感恩节",nthWeekday(year,11,4,4)]
  ].sort(function(a,b){return new Date(a[1])-new Date(b[1]);});
}

function top3(all, today){
  var fut=all.filter(function(x){return dateDiff(today,x[1])>=0;});
  var take=fut.slice(0,3);
  var i=0;
  while(take.length<3&&i<all.length)take.push(all[i++]);
  return take.slice(0,3);
}

// ── DSL 帮助函数 ──────────────────────────────────────
function t(text, sz, wt, color, extra){
  var el={type:"text",text:String(text),font:{size:sz,weight:wt||"regular"},textColor:color||"#FFFFFF"};
  if(extra)for(var k in extra)el[k]=extra[k];
  return el;
}
function ic(sym,sz,color){return{type:"image",src:"sf-symbol:"+sym,width:sz,height:sz,color:color};}
function sp(len){return len!=null?{type:"spacer",length:len}:{type:"spacer"};}
function row(children,opts){
  var el={type:"stack",direction:"row",alignItems:"center",children:children};
  if(opts)for(var k in opts)el[k]=opts[k];
  return el;
}
function col(children,opts){
  var el={type:"stack",direction:"column",alignItems:"start",children:children};
  if(opts)for(var k in opts)el[k]=opts[k];
  return el;
}

// ── 主函数 ────────────────────────────────────────────
export default async function(ctx){
  var now=new Date();
  var y=now.getFullYear(), ny=y+1;
  var today=y+"-"+(now.getMonth()+1)+"-"+now.getDate();

  // 农历
  var L=C.s2l(y,now.getMonth()+1,now.getDate());
  var wkCN=["日","一","二","三","四","五","六"][now.getDay()];

  // 四类节日
  var LEG=top3(legalList(y).concat(legalList(ny)),today);
  var TRM=top3(termList(y).concat(termList(ny)),today);
  var FOL=top3(folkList(y).concat(folkList(ny)),today);
  var INT=top3(intlList(y).concat(intlList(ny)),today);

  function dds(arr){return arr.map(function(x){return dateDiff(today,x[1]);});}
  var dL=dds(LEG), dT=dds(TRM), dF=dds(FOL), dI=dds(INT);

  // ── 颜色：液态玻璃高对比方案 ───
  var AC={
    legal:"#FF8D8D",
    term :"#71F2C8",
    folk :"#FFD98A",
    intl :"#8BC7FF",
    main :"rgba(255,255,255,0.96)",
    sub  :"rgba(255,255,255,0.82)",
    dim  :"rgba(255,255,255,0.64)",
    faint:"rgba(255,255,255,0.34)",
    sep  :"rgba(255,255,255,0.14)",
  };

  // ── 文本状态：不使用任何框，仅用颜色和字重区分 ───
  function dayText(days, accent){
    if(days===0){
      return {
        label:"今天",
        color:accent,
        weight:"bold"
      };
    }
    return {
      label:days+"天",
      color:"rgba(255,255,255,0.72)",
      weight:"semibold"
    };
  }

  // ── 单个节日项：名称 + 竖分隔 + 天数 ───
  function festItem(name, days, accent){
    var dt=dayText(days, accent);
    return row([
      t(name, 10, days===0?"semibold":"regular", days===0?AC.main:AC.dim),
      t("|", 9, "regular", AC.faint),
      t(dt.label, 10, dt.weight, dt.color, {fontFamily:"Menlo"}),
    ],{gap:4});
  }

  // ── 行标签：仅图标 + 标签文字，无框 ───
  function badge(sfSym, label, accent){
    return row([
      ic(sfSym, 10, accent),
      t(label, 10, "semibold", accent),
    ],{gap:4});
  }

  // ── 整行 ───
  function festRow(sfSym, label, accent, items, ds){
    return row([
      badge(sfSym, label, accent),
      sp(5),
      festItem(items[0][0], ds[0], accent),
      sp(7),
      festItem(items[1][0], ds[1], accent),
      sp(7),
      festItem(items[2][0], ds[2], accent),
      sp(),
    ],{alignItems:"center"});
  }

  // ── 头部 ───
  var lunarDay  = L ? L.iDay  : "--";
  var lunarMon  = L ? L.iMon  : "--";
  var gzYr      = L ? L.gY+"年" : "";
  var gzLine    = L ? L.gM+"月 · "+L.gD+"日 · "+L.ani+"年" : "";
  var astro     = L ? L.astro : "";

  var headerLeft = col([
    t(lunarDay, 27, "bold", AC.main),
    row([
      t(lunarMon, 10, "medium", AC.sub),
      t("·", 10, "regular", AC.faint),
      t(gzYr, 10, "medium", AC.sub),
    ],{gap:4}),
  ],{gap:3});

  var headerRight = col([
    row([
      ic("calendar", 12, "rgba(255,255,255,0.72)"),
      t((now.getMonth()+1)+"月"+now.getDate()+"日", 15, "semibold", AC.main),
    ],{gap:4}),
    t("星期"+wkCN+" · "+astro, 10, "medium", AC.sub),
    t(gzLine, 9, "regular", AC.dim),
  ],{gap:2, alignItems:"end"});

  var header = row([headerLeft, sp(), headerRight],{alignItems:"center"});

  // ── 细分隔线 ───
  function divider(){
    return row([sp()],{height:1, backgroundColor:AC.sep});
  }

  return {
    type:"widget",
    padding:[11,12,10,12],
    gap:0,
    backgroundGradient:{
      type:"linear",
      colors:[
        "rgba(16,24,48,0.96)",
        "rgba(34,52,92,0.90)",
        "rgba(62,104,162,0.84)",
        "rgba(164,205,255,0.34)"
      ],
      stops:[0,0.42,0.82,1],
      startPoint:{x:0,y:0},
      endPoint:{x:1,y:1},
    },
    children:[
      header,
      sp(6),
      divider(),
      sp(6),
      festRow("flag.fill",                 "法定", AC.legal, LEG, dL),
      sp(5),
      festRow("leaf.fill",                 "节气", AC.term,  TRM, dT),
      sp(5),
      festRow("moon.stars.fill",           "民俗", AC.folk,  FOL, dF),
      sp(5),
      festRow("globe.asia.australia.fill", "国际", AC.intl,  INT, dI),
    ],
  };
}
