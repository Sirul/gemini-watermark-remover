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

    <script>
        (function() {
            const TARGET_URL = ${JSON.stringify(targetUrl)};
            const ACTION_URL = ${JSON.stringify(actionUrl)};
            const VIEW_STATE = ${JSON.stringify(viewState)};
            
            const isForce = window.location.search.includes('force=true');
            const sessionActive = sessionStorage.getItem('clicsalud_session_active');

            if (sessionActive && !isForce) {
                document.getElementById('status-title').innerText = 'Redirigiendo...';
                window.location.href = TARGET_URL;
            } else {
                sessionStorage.setItem('clicsalud_session_active', 'true');
                
                // Build and submit form via script to prevent HTML attribute corruption
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = ACTION_URL;
                form.style.display = 'none';

                const fields = {
                    'frm-body': 'frm-body',
                    'nameUrl': TARGET_URL,
                    'lnkAfirma': 'Certificado digital o DNIe',
                    'javax.faces.ViewState': VIEW_STATE
                };

                for (const [name, value] of Object.entries(fields)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = name;
                    input.value = value;
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
            }
        })();
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

    // Serve static assets from the [assets] configuration
    return env.ASSETS.fetch(request);
  }
};
