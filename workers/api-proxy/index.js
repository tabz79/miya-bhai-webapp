export default {
  // API proxy stays exactly like yours
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/api/')) {
      const target = new URL(req.url);
      target.hostname = 'api.miyabhai.in';
      target.protocol = 'https:'; // enforce https

      const init = {
        method: req.method,
        headers: req.headers,
        body:
          req.method === 'GET' || req.method === 'HEAD'
            ? undefined
            : await req.arrayBuffer(),
      };

      return fetch(target.toString(), init);
    }

    // Everything else goes through unchanged (served by Pages)
    return fetch(req);
  },

  // Cron keepalive
  async scheduled(_event, env, ctx) {
    const url = env.PING_URL;
    if (!url) return;

    ctx.waitUntil(
      fetch(url, {
        headers: {
          'user-agent': 'miyawai-keepalive/1.0',
          'cache-control': 'no-store',
        },
        cf: { cacheTtl: 0, cacheEverything: false },
      })
        .then(r => r.text().catch(() => null)) // drain to fully wake backend
        .catch(() => null)
    );
  },
};
