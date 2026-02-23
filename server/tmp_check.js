import fs from 'fs';

const urls = [
  'http://localhost:5002/api/track',
  'http://localhost:5002/api/projects',
  'http://localhost:5002/api/profile',
  'http://localhost:5002/api/skills'
];

(async function(){
  const results = {};
  for (const u of urls) {
    try {
      const r = await fetch(u);
      const text = await r.text();
      results[u] = { status: r.status, body: text };
    } catch (e) {
      results[u] = { error: e.message };
    }
  }
  fs.writeFileSync('./tmp_results.json', JSON.stringify(results, null, 2));
  console.log('done');
})();
