// api/index.js
// The ONE authoritative production API entry point for Vercel.
//
// It simply re-exports the compiled Express application from `backend/dist`, so the local
// development server, the tests and the Vercel deployment all run the exact same routes,
// controllers, providers, validation and error handling.
//
// There is intentionally NO second/mock API implementation in this file.
// Build the backend first (`npm --prefix backend run build`) — see `vercel.json` buildCommand.

const backend = require('../backend/dist/index.js');

const app = backend.default || backend;

module.exports = app;
