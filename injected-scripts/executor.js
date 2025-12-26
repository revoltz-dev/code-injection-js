(function() {
  const getScriptParams = () => {
    const params = new URLSearchParams(document.currentScript.src.split('?')[1] || '');
    return {
      id: params.get('id') || '',
      name: params.get('name') || 'Script sem nome'
    };
  };
  
  const logExecution = (name, success, error) => {
    if (success) {
      console.log(`%c[Code Injection] "${name}" executado com sucesso`, 'color: green; font-weight: bold;');
    } else {
      console.error(`%c[Code Injection] "${name}" erro na execução:`, 'color: red; font-weight: bold;', error);
    }
  };
  
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'js-injector-execute') {
      try {
        const { code, name, id } = event.data;
        (new Function(code))();
        logExecution(name, true);
        
        window.postMessage({
          type: 'js-injector-executed',
          id: id,
          success: true
        }, '*');
      } catch (error) {
        logExecution(event.data.name, false, error);
        
        window.postMessage({
          type: 'js-injector-executed',
          id: event.data.id,
          success: false,
          error: error.message
        }, '*');
      }
    }
  });
  
  const scriptParams = getScriptParams();
  if (scriptParams.id) {
    window.postMessage({
      type: 'js-injector-ready',
      id: scriptParams.id
    }, '*');
  }
  
  console.log('%c[Code Injection] Script executor carregado', 'color: green; font-weight: bold;');
})(); 