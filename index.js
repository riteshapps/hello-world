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

// Block suspicious requests
function isBlockedPath(url) {
  const blockedPatterns = [
    /\.env/i,
    /\.git/i,
    /phpinfo/i,
    /wp-admin/i,
    /wp-login/i,
    /wp-content/i,
    /wp-includes/i,
    /\.php$/i,
    /\.php\d$/i,
    /phpmyadmin/i,
    /\.well-known.*\.php/i,
    /admin/i,
    /shell/i,
    /upload/i,
    /backup/i,
    /config/i,
    /\.sql/i,
    /\.zip/i,
    /\.key/i,
    /\.pem/i,
    /\.ini$/i,
    /\.json$/i,
    /\.yml$/i,
    /\.yaml$/i,
    /package-lock\.json/i,
    /composer\.json/i,
    /Dockerfile/i,
    /docker-compose/i,
    /\.aws/i,
    /credentials/i,
    /secret/i
  ];
  
  return blockedPatterns.some(pattern => pattern.test(url));
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
  
  // Block malicious paths immediately
  if (isBlockedPath(req.url)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
    
    // Log blocked request
    const timestamp = formatDate(new Date());
    const duration = Date.now() - start;
    console.log(
      `[${timestamp}] BLOCKED "${req.method} ${req.url}" 404 ${duration}ms - ${ip}`
    );
    return;
  }
  
  // Basic routing
  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Hello World</h1>');
  } else if (req.url === '/robots.txt' && req.method === 'GET') {
    // Serve robots.txt to reduce noise in logs
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('User-agent: *\nDisallow: /admin\nDisallow: /config');
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  }
  
  // Log after response completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = formatDate(new Date());
    
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
