/**
 * GOTA HVAC — AI proxy
 *
 * The dashboard used to call api.anthropic.com straight from the browser,
 * which meant the API key sat in browser storage and every request was at the
 * mercy of whatever extension, browser or network happened to be in the way.
 *
 * This sits in between. The page posts here with no key at all; this forwards
 * the request to Anthropic with the key held as a Worker secret, and returns
 * the reply with CORS headers the browser will accept.
 *
 * Deploy: Cloudflare dashboard → Workers & Pages → Create → paste this →
 * Settings → Variables → add a SECRET named ANTHROPIC_API_KEY → Deploy.
 */

// Only these pages may use the proxy. Without this, anyone who found the URL
// could spend your Anthropic credit.
const ALLOWED_ORIGINS = [
  'https://adg-tx.github.io',
  'http://localhost:8000',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: { type: 'method_not_allowed', message: 'POST only' } }),
        { status: 405, headers: { ...cors, 'content-type': 'application/json' } });
    }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: { type: 'forbidden_origin', message: 'This origin is not allowed to use this proxy.' } }),
        { status: 403, headers: { ...cors, 'content-type': 'application/json' } });
    }
    if (!env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: { type: 'not_configured', message: 'ANTHROPIC_API_KEY secret is not set on the Worker.' } }),
        { status: 500, headers: { ...cors, 'content-type': 'application/json' } });
    }

    let body;
    try { body = await request.text(); }
    catch (e) {
      return new Response(JSON.stringify({ error: { type: 'bad_request', message: 'Could not read the request body.' } }),
        { status: 400, headers: { ...cors, 'content-type': 'application/json' } });
    }

    // Cap the payload so a runaway upload cannot rack up a bill.
    if (body.length > 12 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: { type: 'too_large', message: 'That file is too big to read. Try a photo of the receipt instead of a scan.' } }),
        { status: 413, headers: { ...cors, 'content-type': 'application/json' } });
    }

    try {
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body,
      });
      const text = await upstream.text();
      return new Response(text, { status: upstream.status, headers: { ...cors, 'content-type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: { type: 'upstream_error', message: String(e && e.message || e) } }),
        { status: 502, headers: { ...cors, 'content-type': 'application/json' } });
    }
  },
};
