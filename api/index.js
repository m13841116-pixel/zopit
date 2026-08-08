try {
  const app = require('../server_prod.cjs').default || require('../server_prod.cjs');
  module.exports = app;
} catch (err) {
  console.error("CRITICAL ERROR LOADING SERVER_PROD.CJS IN VERCEL API ENTRYPOINT:", err);
  
  // Safe lazy-require express for fallback reporting
  let express;
  try {
    express = require('express');
  } catch (e) {
    // If even express fails to load, write a raw node response
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
