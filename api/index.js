try {
  let appModule;
  try {
    appModule = require('../dist/server.cjs');
  } catch (e1) {
    console.warn('[Vercel API] Could not load ../dist/server.cjs, trying ../server_prod.cjs...', e1.message);
    appModule = require('../server_prod.cjs');
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
      error: "Critical backend load failure on Vercel",
      details: err.message,
      stack: err.stack
    });
  });
  module.exports = app;
}
