// 逐帧离屏渲染：scene.html → out/video.mp4（无声）+ out/subtitles.srt + out/shots.txt
// 用法：node render.mjs [scene.html] [--from 秒] [--to 秒] [--preview]
//   --preview  只渲染半分辨率、15fps，快速检查节奏
// 依赖：npm i（playwright），系统里有 ffmpeg（或 npm i ffmpeg-static）
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? Number(args[i + 1]) : dflt; };
const preview = args.includes('--preview');
const here = dirname(fileURLToPath(import.meta.url));
const scenePath = resolve(args.find(a => a.endsWith('.html')) ?? `${here}/scene.html`);
const outDir = resolve(dirname(scenePath), 'out');
mkdirSync(outDir, { recursive: true });

async function ffmpegBin() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { return (await import('ffmpeg-static')).default; } catch { return 'ffmpeg'; }
}

const srtTime = s => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(scenePath).href + '?render=1');
await page.evaluate(() => document.fonts.ready);
const meta = await page.evaluate(() => {
  const { W, H, FPS, DURATION, SUBS, SHOTS } = window.__vibe;
  return { W, H, FPS, DURATION, SUBS, SHOTS };
});

// 字幕：两份——双语（中文一行、英文一行）和纯中文，剪映里按需导入
const srt = (fmt) => meta.SUBS.map((s, i) => `${i + 1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${fmt(s)}\n`).join('\n');
writeFileSync(`${outDir}/subtitles.srt`, srt(s => s.en ? `${s.zh}\n${s.en}` : s.zh));
writeFileSync(`${outDir}/subtitles.zh.srt`, srt(s => s.zh));
// 镜头切点：在剪映里对照着打标记、卡音效
writeFileSync(`${outDir}/shots.txt`,
  meta.SHOTS.map((s, i) => `镜头${i + 1}\t${srtTime(s.start)} → ${srtTime(s.end)}`).join('\n') + '\n');

const fps = preview ? 15 : meta.FPS;
const from = flag('--from', 0), to = Math.min(flag('--to', meta.DURATION), meta.DURATION);
const total = Math.round((to - from) * fps);
const outFile = `${outDir}/${preview ? 'preview' : 'video'}.mp4`;
const scale = preview ? ['-vf', 'scale=960:-2'] : [];

const ff = spawn(await ffmpegBin(), [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  ...scale, '-c:v', 'libx264', '-preset', preview ? 'veryfast' : 'slow', '-crf', preview ? '28' : '16',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((ok, fail) => ff.on('close', c => c === 0 ? ok() : fail(new Error(`ffmpeg 退出码 ${c}`))));

const started = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / fps;
  const dataUrl = await page.evaluate(t => {
    window.__vibe.renderFrame(t);
    return document.getElementById('c').toDataURL('image/jpeg', 0.95);
  }, t);
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r渲染 ${i}/${total} 帧  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await ffDone;
await browser.close();
console.log(`\n完成：${outFile}\n字幕：${outDir}/subtitles.srt（双语） / subtitles.zh.srt（中文）\n切点：${outDir}/shots.txt`);
