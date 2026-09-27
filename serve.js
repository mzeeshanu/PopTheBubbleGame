// Static file server for the game.
//
// Doubles as the production server on Railway: it binds to the port Railway
// hands us through $PORT and listens on 0.0.0.0, not just localhost, because a
// container that only listens on 127.0.0.1 is unreachable from outside and the
// deploy will look healthy while serving nothing.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'bubble-cat');
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
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';

  const file = path.join(ROOT, path.normalize(rel).replace(/^([\\/])+/, ''));
  if (!file.startsWith(ROOT)) {           // no escaping the web root
    res.writeHead(403).end('forbidden');
    return;
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // the game is one file and changes on every deploy, so never let a proxy
      // or browser hold on to a stale copy of it
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(buf);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Bubble Cat serving on http://${HOST}:${PORT}`);
});

// Railway stops containers with SIGTERM; exit cleanly so deploys roll over fast
process.on('SIGTERM', () => server.close(() => process.exit(0)));
