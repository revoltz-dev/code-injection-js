window._JSInjector = window._JSInjector || {
  id: 'js-injector-' + Date.now(),
  version: '1.0',
  executedScripts: [],
  blobUrls: [],
  executeViaBlob: function (code, scriptName) {
    try {
      const wrappedCode = `
        try {
          ${code}
          console.log('%c[Code Injection] "${scriptName || 'Script sem nome'}" executado com sucesso', 'color: green; font-weight: bold;');
        } catch(err) {
          console.error('%c[Code Injection] "${scriptName || 'Script sem nome'}" erro na execução:', 'color: red; font-weight: bold;', err);
        }
      `;

      const blob = new Blob([wrappedCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      this.blobUrls.push(blobUrl);

      const script = document.createElement('script');
      script.src = blobUrl;
      script.setAttribute('data-js-injector', this.id);
      script.setAttribute('data-script-name', scriptName || 'unnamed-script');
      document.head.appendChild(script);

      this.executedScripts.push({
        name: scriptName || 'unnamed-script',
        timestamp: Date.now(),
        success: true,
        method: 'blob-url'
      });

      return true;
    } catch (error) {
      console.error('%c[Code Injection] Erro na execução:', 'color: red; font-weight: bold;', error);

      this.executedScripts.push({
        name: scriptName || 'unnamed-script',
        timestamp: Date.now(),
        success: false,
        error: error.message,
        method: 'blob-url'
      });

      return false;
    }
  },

  releaseBlobs: function () {
    this.blobUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('%c[Code Injection] Falha ao liberar Blob URL:', 'color: red; font-weight: bold;', e);
      }
    });
    this.blobUrls = [];
  },

  injectScript: function (code, scriptName) {
    return this.executeViaBlob(code, scriptName);
  },

  cleanup: function () {
    this.releaseBlobs();
  }
};

window.addEventListener('beforeunload', function () {
  if (window._JSInjector) {
    window._JSInjector.cleanup();
  }
});

console.log('%c[Code Injection] Script de injeção principal carregado, versão:', 'color: green; font-weight: bold;', window._JSInjector.version); 