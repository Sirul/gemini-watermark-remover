export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetUrl = 'https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/clicsalud/pages/anonimo/historia/medicacion/medicacionActiva.jsf';

    if (url.pathname === '/salud' || url.pathname === '/salud/') {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
          }
        });
        
        const html = await response.text();
        const match = html.match(/id="javax.faces.ViewState" value="([^"]+)"/);
        const viewState = match ? match[1] : '';

        if (!viewState) {
          return new Response('Error: No se pudo conectar con el servicio de salud. Reintenta en unos segundos.', {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }

        const formHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cargando Medicación...</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f4f4; }
        .loader { text-align: center; }
    </style>
</head>
<body onload="document.getElementById('autoForm').submit();">
    <div class="loader">
        <h2>Conectando con ClicSalud+...</h2>
        <p>Por favor, selecciona tu certificado cuando aparezca la ventana.</p>
    </div>
    <form id="autoForm" action="${targetUrl}" method="POST" style="display:none;">
        <input type="hidden" name="formMedicacion" value="formMedicacion">
        <input type="hidden" name="lnkAfirma" value="Certificado digital o DNIe">
        <input type="hidden" name="javax.faces.ViewState" value="${viewState}">
    </form>
</body>
</html>
        `;

        return new Response(formHtml, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
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
