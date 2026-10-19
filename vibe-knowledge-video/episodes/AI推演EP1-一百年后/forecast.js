// AI 推演 EP1《一百年后》：字幕和画面里的每个推演数字都来自这里
// 运行：node forecast.js

// 1. 凯恩斯的算法：每年增长 2%，100 年后是多少倍
const keynes = 1.02 ** 100;
console.log('每年 2%，100 年：', keynes.toFixed(2), '倍');

// 2. 寿命：最长寿国家的人均寿命每年 +3 个月（Oeppen & Vaupel 2002）
//    起点：日本女性 2023 年约 87.1 岁（待核实）
const leStart = 87.1, leYear = 2023, perYear = 0.25;
for (const y of [2050, 2075, 2100, 2126]) console.log('寿命外推', y, (leStart + (y - leYear) * perYear).toFixed(1));

// 3. 太阳能学习曲线：装机每翻一倍，价格降 20%（Our World in Data）
const lr = 0.20;
for (const n of [1, 5, 10, 15]) console.log(`再翻 ${n} 倍`, '价格剩', ((1 - lr) ** n * 100).toFixed(1) + '%', '累计装机', 2 ** n + ' 倍');

// 4. 人口（UN WPP 2024 中方案）
const pop = { 2024: 8.2, peak: 10.3, 2100: 10.2 };
console.log('到顶峰增加', ((pop.peak / pop[2024] - 1) * 100).toFixed(0) + '%');
console.log('中国 2024→2100 减少', ((1 - 633 / 1410) * 100).toFixed(0) + '%');

// 5. AI 研究者调查（Grace 等 2024）
console.log('HLMI 与 FAOL 50% 年份相差', 2116 - 2047, '年');

// 6. 如果全球人均收入每年增长 2%，2126 年是今天的几倍（同凯恩斯的算法）
console.log('2026→2126 每年 2%：', (1.02 ** 100).toFixed(1), '倍；每年 1%：', (1.01 ** 100).toFixed(1), '倍');
