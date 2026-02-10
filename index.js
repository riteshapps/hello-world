// index.js

const http = require('http');
const PORT = 3000;
const HOST = '0.0.0.0';

// Format timestamp: YYYY-MM-DD HH:mm:ss
function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const server = http.createServer((req, res) => {
  const start = Date.now();

  // Basic routing
  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Hello World</h1>');
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  }

  // Log after response completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = formatDate(new Date());

    // Get real client IP behind Traefik
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    console.log(
      `[${timestamp}] INFO "${req.method} ${req.url}" ${res.statusCode} ${duration}ms - ${ip}`
    );
  });
});

// Start server
server.listen(PORT, HOST, () => {
  const primaryDomain = process.env.PRIMARY_DOMAIN;
  const publicUrl = primaryDomain
    ? `https://${primaryDomain}`
    : `http://localhost:${PORT}`;

  console.log('--------------------------------------------------');
  console.log('✅ Application Started');
  console.log(`🌍 Public URL: ${publicUrl}`);
  console.log(`📦 Environment: 'production'`);
  console.log('--------------------------------------------------');
});

// Graceful shutdown (important for Docker / EasyPanel)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});