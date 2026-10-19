function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let r=Math.imul(seed^seed>>>15,1|seed);r=r+Math.imul(r^r>>>7,61|r)^r;return((r^r>>>14)>>>0)/4294967296;};}
const day = s => new Date(s).getTime()/864e5;
const fmt = d => new Date(d*864e5).toISOString().slice(0,7);
// METR TH1.1 50% 时间跨度（分钟），发布时间
const pts = [['GPT-4 0314','2023-03-14',3.5],['GPT-4 1106','2023-11-06',3.6],['Claude 3.7 Sonnet','2025-02-24',60],['o3','2025-04-16',121],['Claude Opus 4','2025-05-22',101],['GPT-5','2025-08-07',214],['Claude Opus 4.5','2025-11-24',320]];
// 最小二乘拟合 log2(分钟) ~ 日期
const xs=pts.map(p=>day(p[1])), ys=pts.map(p=>Math.log2(p[2]));
const mx=xs.reduce((a,b)=>a+b)/xs.length, my=ys.reduce((a,b)=>a+b)/ys.length;
const k=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/xs.reduce((s,x)=>s+(x-mx)**2,0);
console.log('自拟合翻倍天数', (1/k).toFixed(0));
const anchor=day('2025-11-24'), h0=320;
const goals={'一个工作日 8h':480,'一个工作周 40h':2400,'一个工作月 167h':10020,'一个工作年 2000h':120000};
for (const [name,g] of Object.entries(goals)) {
  const r=[196.5,130.8].map(dt=>fmt(anchor+Math.log2(g/h0)*dt));
  console.log(name,'按7个月翻倍:',r[0],'按131天翻倍:',r[1]);
}
// 蒙特卡洛：翻倍天数 ~ 均匀[107,161]，起点 ~ 对数均匀[170,729]
const R=rng(2026), N=200000;
for (const [name,g] of Object.entries(goals)) {
  const ds=[];
  for(let i=0;i<N;i++){const dt=107+R()*54, h=Math.exp(Math.log(170)+R()*(Math.log(729)-Math.log(170))); ds.push(anchor+Math.max(0,Math.log2(g/h))*dt);}
  ds.sort((a,b)=>a-b);
  console.log('MC',name,'P10',fmt(ds[N*0.1|0]),'P50',fmt(ds[N*0.5|0]),'P90',fmt(ds[N*0.9|0]));
}
// 算力 4–5x/年，2024→2030
console.log('算力 2030/2024:', 4**6, 5**6);
// 电力 IEA
console.log('数据中心电力年增速', ((945/415)**(1/6)-1)*100);
