// tools/capture.cjs
const http = require('http');
const port = 4002;
const server = http.createServer((req, res) => {
  console.log("=== Incoming request ===");
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("Headers:");
  Object.keys(req.headers).forEach(k => {
    console.log(`  ${k}: ${req.headers[k]}`);
  });
  req.on('data', () => {}); // drain
  req.on('end', () => {
    res.writeHead(200, {"Content-Type":"text/plain"});
    res.end("ok");
  });
});
server.listen(port, () => console.log(`Logger listening on http://localhost:${port}`));
