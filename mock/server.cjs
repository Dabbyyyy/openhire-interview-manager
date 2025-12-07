const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();
const PORT = process.env.MOCK_PORT || 5174;

server.use(middlewares);

// CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Simple logger
server.use((req, _res, next) => {
  console.log(`[mock] ${req.method} ${req.url}`);
  next();
});

server.use(router);

server.listen(PORT, () => {
  console.log(`[mock] running on http://localhost:${PORT}`);
});
