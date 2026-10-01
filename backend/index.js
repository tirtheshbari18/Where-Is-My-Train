// backend/index.js
// Entrypoint for Vercel Express service and Node.js loaders
const backend = require('./dist/index.js');
const app = backend.default || backend;

module.exports = app;
module.exports.default = app;
