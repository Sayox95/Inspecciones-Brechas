// functions/api/sync.js
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
      'Vary': 'Origin'
    }
  });
}

function getUpstream(env) {
  return env?.APPS_SCRIPT_POST_URL
    || 'https://script.google.com/macros/s/AKfycby1FnajlCXUifEGlaqSwLZ4Q9LfVoVH8dWcSzL0_S2x4EFWPD5cygXikqsMm8Yhbr9TuA/exec';
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('Origin') || '*';
  const upstream = getUpstream(env);

  try {
    const url = new URL(request.url);
    const qs = url.search || '';

    const controller = new AbortController();
    const timeoutMs = 45000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(upstream + qs, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timer);

    // NO conviertas a text(): rompe binarios (imágenes)
    // Usa el stream tal cual (resp.body) y copia el Content-Type original
    const ct = resp.headers.get('content-type') || 'application/octet-stream';

    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
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
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
        'Vary': 'Origin',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '*';
  const bodyText = await request.text();
  const upstream = getUpstream(env);

  try {
    const controller = new AbortController();
    const timeoutMs = 45000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const upstreamResp = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyText,
      signal: controller.signal
    });

    clearTimeout(timer);

    // Igual que en GET: no lo conviertas a texto; respeta el tipo original
    const ct = upstreamResp.headers.get('content-type') || 'application/json';

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
        'Vary': 'Origin',
        'Content-Type': ct,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo conectar con Apps Script' }), {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
        'Vary': 'Origin',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}
