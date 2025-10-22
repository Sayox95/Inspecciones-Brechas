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
  // Usa tu var de entorno si la tienes (rename si prefieres)
  return env?.APPS_SCRIPT_POST_URL
    || 'https://script.google.com/macros/s/AKfycbwrvUOBN5g5Xp6N1VO60mU2HQQV641kIOFlVR0eGv-V-oeulgg8u2wKSNcbinWGxcBv_g/exec';
}

export async function onRequestGet({ request, env }) {
  const origin = request.headers.get('Origin') || '*';

  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    const id   = url.searchParams.get('id');

    // ===== Proxy directo de imagen (evita CORS y binarios de GAS) =====
    if (mode === 'img' && id) {
      const driveUrl = `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);

      const resp = await fetch(driveUrl, { signal: controller.signal });

      clearTimeout(timer);

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
    }

    // ===== Proxy normal hacia Apps Script =====
    const upstream = getUpstream(env);
    const qs = url.search || '';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    const resp = await fetch(upstream + qs, { method: 'GET', signal: controller.signal });

    clearTimeout(timer);

    // Reenvía en streaming para soportar binarios (no usar .text())
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
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo obtener datos (GET)' }), {
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
  const upstream = getUpstream(env);

  try {
    // Leemos como texto para no romper base64
    const bodyText = await request.text();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    const upstreamResp = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyText,
      signal: controller.signal
    });

    clearTimeout(timer);

    // Devuelve stream del upstream (no convertir a .text())
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
