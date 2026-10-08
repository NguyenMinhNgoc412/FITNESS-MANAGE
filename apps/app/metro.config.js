const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');
// pnpm may place expo-sqlite outside the workspace. The dev Worker URL loses
// its ../ segments in the browser and returns 404; use an in-workspace entry.
const workerEntry = '/' + path.relative(config.server.unstable_serverRoot || config.projectRoot, path.join(__dirname, 'src/features/ai-analysis/sqlite-worker.js')).replace(/\\/g, '/').replace(/\.js$/, '.bundle');
const rewrite = config.server.rewriteRequestUrl;
config.server.rewriteRequestUrl = requestUrl => {
  const url = new URL(requestUrl, 'http://localhost');
  if (url.pathname.endsWith('/node_modules/expo-sqlite/web/worker.bundle')) return workerEntry + url.search;
  return rewrite ? rewrite(requestUrl) : requestUrl;
};
const previous = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = previous ? previous(middleware, server) : middleware;
  return (req, res, nextHandler) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return next(req, res, nextHandler);
  };
};
module.exports = config;
