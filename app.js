// Production entry point
try {
  require('./dist/server.cjs');
} catch (err) {
  try {
    require('./server_prod.cjs');
  } catch (err2) {
    console.error('Failed to load server bundle:', err.message, err2.message);
  }
}

