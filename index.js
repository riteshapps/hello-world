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

// Whitelist: Only allow these paths
function isAllowedPath(url) {
  // Remove query strings and normalize
  const path = url.split('?')[0].toLowerCase();
  
  const allowedPatterns = [
    /^\/$/,                    // Homepage only
    /^\/favicon\.ico$/,        // Favicon
    /^\/robots\.txt$/,         // Favicon
  ];
  
  return allowedPatterns.some(pattern => pattern.test(path));
}

const server = http.createServer((req, res) => {
  const start = Date.now();
  
  // Get real client IP - Cloudflare specific
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIp = req.headers['x-real-ip'];
  
  // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > socket
  const ip = cfConnectingIp || 
             xRealIp || 
             (xForwardedFor ? xForwardedFor.split(',')[0].trim() : null) ||
             req.socket.remoteAddress;
  
  const logRequest = (level, statusCode) => {
    const duration = Date.now() - start;
    const timestamp = formatDate(new Date());
    console.log(
      `[${timestamp}] ${level} "${req.method} ${req.url}" ${statusCode} ${duration}ms - ${ip}`
    );
  };
  
  // Only allow GET and HEAD methods
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    logRequest('BLOCKED', 405);
    return;
  }
  
  // If not in whitelist, it's blocked
  if (!isAllowedPath(req.url)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
    logRequest('BLOCKED', 404);
    return;
  }
  
  // Serve allowed content
  if (req.url === '/' || req.url === '') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.end('<h1>Hello World</h1>');
    logRequest('INFO', 200);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
    logRequest('INFO', 404);
  }
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
  console.log(`📦 Environment: production`);
  console.log(`🛡️  Security: Whitelist Mode (Deny All Except Allowed)`);
  console.log('--------------------------------------------------');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});
