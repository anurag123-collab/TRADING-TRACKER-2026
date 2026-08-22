// Trading Tracker 2026 - Vercel Entrypoint Helper
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.end(fs.readFileSync(filePath, 'utf8'));
  }
  res.statusCode = 404;
  res.end('Not Found');
};
