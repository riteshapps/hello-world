const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Format date as: YYYY-MM-DD HH:mm:ss
function formatDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const server = http.createServer((req, res) => {
  const start = Date.now();

  // Example route
  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Hello World</h1>');
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  }

  // Logging after response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = formatDate(new Date());
    console.log(
      `[${timestamp}] INFO "${req.method} ${req.url}" ${res.statusCode} ${duration}ms`
    );
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});