const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:3000',
    },
    timeout: 180000, // 3 minutes timeout for large video audio transcription
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.warn(`[Proxy 3001 -> 3000] Proxy error on ${req.method} ${req.url}:`, err.message);
    if (req.method === 'GET') {
      res.writeHead(302, { Location: 'http://localhost:3000' + req.url });
      res.end();
    } else {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Dev server reconnecting. Please retry in a few seconds.' }));
    }
  });

  req.pipe(proxyReq);
});

server.timeout = 180000;
server.keepAliveTimeout = 180000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('Port 3001 already in use.');
  } else {
    console.error('Proxy error:', err);
  }
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Transparent bridge active: http://localhost:3001 -> http://localhost:3000');
});
