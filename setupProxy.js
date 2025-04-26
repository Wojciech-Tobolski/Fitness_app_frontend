const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://app.trenerwitek.pl',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: function(proxyReq, req, res) {
        // Add CORS headers to the response
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
    })
  );
}; 