// functions/api/sync.js
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,          // o fija tu origen: 'https://sayox95.github.io'
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    }
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '*';
  const bodyText = await request.text(); // JSON en texto (incluye base64)

  // 1) Lee la URL del Apps Script desde una variable de entorno
  const upstream =
    env?.APPS_SCRIPT_POST_URL ||
    'https://script.google.com/macros/s/AKfycbxsLR83iSgWHY9uzKUTsjS1PSJ7zhf_dd2LkQ88ALS84hhCWJomPcO8TO2CuJeVINa7AQ/exec'; // <-- puedes hardcodear aquí si prefieres

  try {
    // (Opcional) Timeout manual
    const controller = new AbortController();
    const timeoutMs = 45000;
    const id = setTimeout(() => controller.abort(), timeoutMs);

    // 2) Reenvía al Apps Script. Usa text/plain para máxima compatibilidad
    const upstreamResp = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyText,
      signal: controller.signal
    });

    clearTimeout(id);

    // 3) Lee cuerpo una sola vez
    const text = await upstreamResp.text();
    const upstreamCT = upstreamResp.headers.get('content-type') || 'application/json';

    // 4) Devuelve al navegador con CORS OK
    return new Response(text, {
      status: upstreamResp.status,
      headers: {
        'Access-Control-Allow-Origin': origin,        // o fija tu origen: 'https://sayox95.github.io'
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Content-Type': upstreamCT,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: 'No se pudo conectar con Apps Script' }),
      {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Vary': 'Origin',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
