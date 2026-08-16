try {
  let appModule;
  try {
    appModule = require('../server_prod.cjs');
  } catch (e1) {
    console.warn('[Vercel API] Could not load ../server_prod.cjs, trying ../dist/server.cjs...', e1.message);
    appModule = require('../dist/server.cjs');
  }
  const app = appModule.default || appModule;
  module.exports = app;
} catch (err) {
  console.error("CRITICAL ERROR LOADING BACKEND IN VERCEL API ENTRYPOINT:", err);
  
  let express;
  try {
    express = require('express');
  } catch (e) {
    module.exports = (req, res) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        error: "Vercel serverless bootstrap failed completely",
        details: err.message,
        stack: err.stack,
        bootstrapError: e.message
      }));
    };
    return;
  }

  const app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: `Critical backend load failure on Vercel: ${err.message}`,
      details: err.message,
      stack: err.stack
    });
  });
  module.exports = app;
}
