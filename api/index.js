// api/index.js
// The ONE authoritative production API entry point for Vercel.
//
// It re-exports the compiled Express application from `backend/dist`, so the local
// development server, the tests and the Vercel deployment all run the exact same routes,
// controllers, providers, validation and error handling.
//
// There is intentionally NO second/mock API implementation in this file.
// The backend must be compiled first — the root `vercel.json` sets
//   installCommand: npm run install:all
//   buildCommand:   npm run build            (= backend tsc && frontend vite build)
// so `backend/dist/index.js` always exists before this function is uploaded.
//
// Exported shape: a plain `(req, res)` handler. Vercel's Node runtime accepts any
// function of arity 2, whereas exporting the Express app object itself depends on
// runtime-specific app detection — the wrapper removes that ambiguity.

let app = null;

try {
  const backend = require('../backend/dist/index.js');
  app = backend.default || backend;
  if (typeof app !== 'function') {
    throw new Error('backend/dist/index.js did not export an Express app');
  }
} catch (err) {
  // Never let a missing/stale build crash the lambda with an unhandled exception:
  // answer with a structured 503 the frontend can degrade gracefully from.
  console.error('[api/index] Unable to load the compiled backend:', err && err.message);
  app = null;
}

module.exports = (req, res) => {
  if (typeof app !== 'function') {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        success: false,
        error: {
          message:
            'Railway API build is unavailable. Run `npm run build` (vercel.json buildCommand) so backend/dist exists.',
          code: 'API_BUILD_MISSING',
        },
      })
    );
    return;
  }
  return app(req, res);
};
