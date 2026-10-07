// api/index.js - Serverless function entrypoint for Vercel
process.env.VERCEL = process.env.VERCEL || '1';
process.env.SERVERLESS = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

let app = null;

function getApp() {
  if (app) return app;
  const path = require('path');
  const candidates = [
    '../backend/dist/index.js',
    './backend/dist/index.js',
    path.join(process.cwd(), 'backend', 'dist', 'index.js'),
    path.join(__dirname, '..', 'backend', 'dist', 'index.js'),
  ];

  for (const cand of candidates) {
    try {
      const mod = require(cand);
      const loaded = mod.default || mod;
      if (typeof loaded === 'function') {
        app = loaded;
        return app;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

module.exports = (req, res) => {
  const handler = getApp();
  if (handler) {
    return handler(req, res);
  }
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json');
  return res.end(
    JSON.stringify({
      success: false,
      error: {
        message: 'Backend API service is starting up.',
        code: 'SERVICE_INITIALIZING',
      },
    })
  );
};
