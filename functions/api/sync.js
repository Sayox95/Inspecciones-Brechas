// functions/api/sync.js
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,                   // o fija tu origen
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',    // ← añade GET
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    }
  });
}

function getUpstream(env) {
  // Reusa tu variable actual; si prefieres, renómbrala a APPS_SCRIPT_URL
  return env?.APPS_SCRIPT_POST_URL
    || 'https://script.google.com/macros/s/AKfycbxmFiUlKrtPzskRQ4k6RQ28f2VSMe4TH1wdmeJwijOxuQSfqu1n4xmoaK6nqJS3-pM_eg/exec';
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('Origin') || '*';
  const upstream = getUpstream(env);

  try {
    // Conserva query string (?mode=all, filtros futuros, etc.)
    const url = new URL(request.url);
    const qs = url.search || '';

    // Timeout manual (opcional)
    const controller = new AbortController();
    const timeoutMs = 45000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(upstream + qs, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timer);

    const text = await resp.text();
    const ct = resp.headers.get('content-type') || 'application/json';

    return new Response(text, {
      status: resp.status,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Content-Type': ct,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo obtener datos de Apps Script' }), {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '*';
  const bodyText = await request.text(); // JSON en texto (incluye base64)
  const upstream = getUpstream(env);

  try {
    // Timeout manual (opcional)
    const controller = new AbortController();
    const timeoutMs = 45000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Reenvía tal cual al Apps Script; text/plain es más tolerante con base64
    const upstreamResp = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyText,
      signal: controller.signal
    });

    clearTimeout(timer);

    const text = await upstreamResp.text();
    const upstreamCT = upstreamResp.headers.get('content-type') || 'application/json';

    return new Response(text, {
      status: upstreamResp.status,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Content-Type': upstreamCT,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo conectar con Apps Script' }), {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}
