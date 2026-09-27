// Static file server for the Sofiarcade site.
//
// The web root is site/, which holds the landing page and one folder per game,
// so a game at site/bubble-cat/ is served at /bubble-cat/.
//
// Doubles as the production server on Railway: it binds to the port Railway
// hands us through $PORT and listens on 0.0.0.0, not just localhost, because a
// container that only listens on 127.0.0.1 is unreachable from outside and the
// deploy will look healthy while serving nothing.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const PORT = process.env.PORT || 5178;
const HOST = '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);

  const target = path.join(ROOT, path.normalize(rel).replace(/^([\/])+/, ''));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {  // no escaping the web root
    res.writeHead(403, { 'Content-Type': 'text/plain' }).end('forbidden');
    return;
  }

  // "/" and "/bubble-cat" both mean that folder's index.html, so the landing
  // page and every game get a clean URL with no filename in it
  let file = target;
  if (rel.endsWith('/') || isDir(target)) file = path.join(target, 'index.html');

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // the games are single files that change on every deploy, so never let a
      // proxy or browser hold on to a stale copy of one
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(buf);
  });
});

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

server.listen(PORT, HOST, () => {
  console.log(`Sofiarcade serving on http://${HOST}:${PORT}`);
});

// Railway stops containers with SIGTERM; exit cleanly so deploys roll over fast
process.on('SIGTERM', () => server.close(() => process.exit(0)));
