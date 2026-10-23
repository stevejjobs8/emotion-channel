// Pixabay 또는 Pexels에서 분위기별 고화질 영상을 찾아 playlist.json에 더하고,
// music 폴더의 mp3 목록으로 music/manifest.json을 만든다.
// 실행: PIXABAY_API_KEY=... node scripts/collect.mjs  (PEXELS_API_KEY도 있으면 둘 다 쓴다)
import { readFile, writeFile, readdir } from 'node:fs/promises';

const PEXELS = process.env.PEXELS_API_KEY;
const PIXABAY = process.env.PIXABAY_API_KEY;
const PER_RUN = Number(process.env.PER_QUERY || 6);   // 한 번 실행할 때 검색어마다 새로 더할 최대 개수
const MAX_CLIPS = Number(process.env.MAX_CLIPS || 600);

// 분위기 → 검색어. 같은 분위기끼리 묶여서 흐른다.
const MOODS = {
  night: ['northern lights', 'starry night sky timelapse', 'milky way'],
  sea: ['ocean sunset', 'calm sea waves golden hour', 'beach at dusk'],
  rain: ['rain on window night', 'rainy city street night', 'raindrops close up'],
  city: ['city lights bokeh night', 'tokyo night street', 'neon reflections'],
  sky: ['clouds timelapse sunset', 'sunrise above clouds', 'pink sky clouds'],
  forest: ['misty forest morning', 'sunlight through trees', 'foggy mountains'],
  snow: ['snow falling night', 'snowy forest', 'winter light'],
  warm: ['candle flame dark', 'fireplace close up', 'warm fairy lights'],
};

const root = new URL('..', import.meta.url);
const playlistUrl = new URL('playlist.json', root);
const playlist = JSON.parse(await readFile(playlistUrl, 'utf8').catch(() => '{"clips":[]}'));
const have = new Set(playlist.clips.map(c => c.id));

// 공급처마다 응답 모양이 달라서, 같은 모양({ id, duration, url, author, files })으로 맞춘다.
const PROVIDERS = [];
if (PEXELS) PROVIDERS.push({
  name: 'Pexels',
  async search(query, page) {
    const u = new URL('https://api.pexels.com/videos/search');
    u.search = new URLSearchParams({ query, orientation: 'landscape', size: 'large', per_page: '30', page: String(page) });
    const r = await fetch(u, { headers: { Authorization: PEXELS } });
    if (!r.ok) throw new Error(`Pexels ${r.status} for "${query}"`);
    return ((await r.json()).videos || []).map(v => ({
      id: `pexels-${v.id}`, duration: v.duration, url: v.url, author: v.user?.name || 'Pexels',
      files: (v.video_files || []).filter(f => f.file_type === 'video/mp4').map(f => ({ width: f.width, height: f.height, link: f.link })),
    }));
  },
});
if (PIXABAY) PROVIDERS.push({
  name: 'Pixabay',
  async search(query, page) {
    const u = new URL('https://pixabay.com/api/videos/');
    u.search = new URLSearchParams({ key: PIXABAY, q: query, per_page: '30', page: String(page), safesearch: 'true' });
    const r = await fetch(u);
    if (!r.ok) throw new Error(`Pixabay ${r.status} for "${query}"`);
    return ((await r.json()).hits || []).map(v => ({
      id: `pixabay-${v.id}`, duration: v.duration, url: v.pageURL, author: v.user || 'Pixabay',
      files: Object.values(v.videos || {}).filter(f => f && f.url).map(f => ({ width: f.width, height: f.height, link: f.url })),
    }));
  },
});

if (PROVIDERS.length) {
  let added = 0;
  for (const [mood, queries] of Object.entries(MOODS)) {
    for (const q of queries) {
      // 매번 다른 페이지를 열어 같은 영상만 모이지 않게 한다
     for (const P of PROVIDERS) {
      const page = 1 + Math.floor(Math.random() * 4);
      let res;
      try { res = await P.search(q, page); } catch (e) { console.warn(e.message); continue; }
      let n = 0;
      for (const v of res) {
        if (n >= PER_RUN) break;
        if (have.has(v.id) || v.duration < 12) continue;
        const files = v.files.filter(f => f.width >= 1280 && f.width > f.height);
        if (!files.some(f => f.width >= 1920)) continue;   // 최소 풀HD가 없는 영상은 뺀다
        playlist.clips.push({ id: v.id, provider: P.name, mood, query: q, duration: v.duration, url: v.url, author: v.author, files });
        have.add(v.id); n++; added++;
      }
     }
    }
  }
  if (playlist.clips.length > MAX_CLIPS) playlist.clips = playlist.clips.slice(-MAX_CLIPS);
  playlist.updated = new Date().toISOString();
  await writeFile(playlistUrl, JSON.stringify(playlist, null, 1) + '\n');
  console.log(`영상 ${added}개 추가, 전체 ${playlist.clips.length}개`);
} else {
  console.log('PIXABAY_API_KEY나 PEXELS_API_KEY가 없어 영상 수집은 건너뜀');
}

const tracks = (await readdir(new URL('music/', root)).catch(() => []))
  .filter(f => /\.(mp3|m4a|ogg)$/i.test(f)).sort();
await writeFile(new URL('music/manifest.json', root), JSON.stringify({ tracks }, null, 1) + '\n');
console.log(`음원 ${tracks.length}곡`);
