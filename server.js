const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Default to production mode on cPanel unless explicitly specified
const dev = process.env.NODE_ENV === 'development';
const hostname = process.env.HOSTNAME || '0.0.0.0';

// Passenger on cPanel can supply PORT as a TCP port number or a Unix domain socket path
const rawPort = process.env.PORT;
const isSocket = rawPort && isNaN(Number(rawPort));
const port = rawPort ? (isSocket ? rawPort : parseInt(rawPort, 10)) : 3000;

const app = next({
  dev,
  dir: __dirname,
  hostname: isSocket ? undefined : hostname,
  port: isSocket ? undefined : port,
});
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    // 15-minute timeout for AI transcription and video export operations
    server.timeout = 900000;
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 125000;

    server.once('error', (err) => {
      console.error('Next.js server error:', err);
      process.exit(1);
    });

    if (isSocket) {
      server.listen(port, () => {
        console.log(`> Next.js production server ready on socket: ${port}`);
      });
    } else {
      server.listen(port, hostname, () => {
        console.log(`> Next.js production server ready on http://${hostname}:${port}`);
      });
    }
  })
  .catch((err) => {
    console.error('Error during app.prepare():', err);
    process.exit(1);
  });
