export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetUrl = 'https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/clicsalud/pages/anonimo/historia/medicacion/medicacionActiva.jsf?opcionSeleccionada=MUMEDICACION';

    if (url.pathname === '/salud' || url.pathname === '/salud/') {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
          }
        });
        
        const html = await response.text();
        const match = html.match(/id="javax.faces.ViewState" value="([^"]+)"/);
        const viewState = match ? match[1] : '';

        if (!viewState) {
          return new Response('Error: No se pudo conectar con el servicio de salud (ViewState no encontrado).', {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }

        const setCookie = response.headers.get('Set-Cookie');
        const jsMatch = setCookie ? setCookie.match(/JSESSIONID=([^;]+)/) : null;
        const jsessionid = jsMatch ? jsMatch[1] : null;

        // Construct the action URL exactly as it was in version 1.6.0
        const actionUrl = jsessionid 
          ? `https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/clicsalud/pages/anonimo/historia/medicacion/medicacionActiva.jsf;jsessionid=${jsessionid}?opcionSeleccionada=MUMEDICACION`
          : targetUrl;

        const formHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cargando Medicación...</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
        .container { text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); max-width: 90%; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        h2 { margin-bottom: 0.5rem; color: #1e3a8a; }
        p { color: #64748b; margin-bottom: 1.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2 id="status-title">Conectando...</h2>
        <p id="status-desc">Preparando acceso seguro.</p>
    </div>

    <form id="autoForm" action="${actionUrl}" method="POST" style="display:none;">
        <input type="hidden" name="frm-body" value="frm-body">
        <input type="hidden" name="nameUrl" value="${targetUrl}">
        <input type="hidden" name="lnkAfirma" value="Certificado digital o DNIe">
        <input type="hidden" name="javax.faces.ViewState" value="${viewState}">
    </form>

    <script>
        const TARGET_URL = 'https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/clicsalud/pages/anonimo/historia/medicacion/medicacionActiva.jsf?opcionSeleccionada=MUMEDICACION';
        const isForce = window.location.search.includes('force=true');
        const sessionActive = sessionStorage.getItem('clicsalud_session_active');

        if (sessionActive && !isForce) {
            document.getElementById('status-title').innerText = 'Redirigiendo...';
            window.location.href = TARGET_URL;
        } else {
            sessionStorage.setItem('clicsalud_session_active', 'true');
            // NO DELAY, immediate submit as in 1.6.0
            document.getElementById('autoForm').submit();
        }
    </script>
</body>
</html>
        `;

        const headers = new Headers({
          'Content-Type': 'text/html; charset=utf-8'
        });
        if (setCookie) headers.append('Set-Cookie', setCookie);

        return new Response(formHtml, { headers });
      } catch (err) {
        return new Response('Error interno al conectar con el servicio de salud.', {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
