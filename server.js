// Static server for ostify.co.uk on App Service (UK South).
// Startup command: node server.js
//
// The deploy workflow puts the site in ./public next to this file, so the
// server itself is never served. Folder URLs get their index.html, and a
// folder without the trailing slash redirects to it so relative links work.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

// Short addresses that send people elsewhere. The application form has been taken down; its old links go to careers.
const REDIRECTS = {
  '/apply': '/careers/',
  '/apply/advisor': '/careers/',
};

function send(res, status, body, type) {
  res.writeHead(status, { ...HEADERS, 'Content-Type': type || 'text/html; charset=utf-8' });
  res.end(body);
}

function notFound(res) {
  fs.readFile(path.join(ROOT, '404.html'), (err, page) => {
    send(res, 404, err ? 'Not found' : page);
  });
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');

  // One address for the site: www goes to ostify.co.uk, keeping the path.
  if ((req.headers.host || '').toLowerCase().startsWith('www.ostify.co.uk')) {
    res.writeHead(301, { ...HEADERS, Location: 'https://ostify.co.uk' + req.url });
    return res.end();
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch (e) {
    return send(res, 400, 'Bad request', 'text/plain');
  }

  const target = REDIRECTS[urlPath.replace(/\/$/, '')];
  if (target) {
    res.writeHead(302, { ...HEADERS, Location: target, 'Cache-Control': 'no-cache' });
    return res.end();
  }

  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) return notFound(res);

  fs.stat(file, (err, stat) => {
    if (err) return notFound(res);
    if (stat.isDirectory()) {
      if (!urlPath.endsWith('/')) {
        res.writeHead(301, { ...HEADERS, Location: urlPath + '/' });
        return res.end();
      }
      return serveFile(path.join(file, 'index.html'), res, req);
    }
    serveFile(file, res, req);
  });
}).listen(PORT);

function serveFile(file, res, req) {
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return notFound(res);
  fs.readFile(file, (err, data) => {
    if (err) return notFound(res);
    const cache = type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600';
    res.writeHead(200, { ...HEADERS, 'Content-Type': type, 'Cache-Control': cache });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}
