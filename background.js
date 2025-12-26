importScripts('sync.js');

if (typeof CodeInjectionSync !== 'undefined') {
    CodeInjectionSync.init().catch(error => {
        console.error('Erro ao inicializar sincronização:', error);
    });
}

function executeScriptIfMatch(tabId, tab) {
    if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
        return;
    }

    try {
        let url = new URL(tab.url);
        let domain = url.hostname;

        chrome.storage.local.get('scripts', (data) => {
            const scripts = data.scripts || {};

            for (const key in scripts) {
                if (domain === scripts[key].domain ||
                    (scripts[key].domain.startsWith('*.') && domain.endsWith(scripts[key].domain.substring(1)))) {

                    let scriptExecutionTime = scripts[key].executionTime || 'automatic';
                    if (scriptExecutionTime !== 'manual' && scriptExecutionTime !== 'automatic') {
                        scriptExecutionTime = 'automatic';
                    }

                    if (scriptExecutionTime === 'manual') {
                        continue;
                    }

                    const isEnabled = scripts[key].enabled !== false;
                    if (!isEnabled) {
                        console.log(`Pulando script desabilitado: ${scripts[key].name || 'Script sem nome'} (${scripts[key].domain})`);
                        continue;
                    }

                    injectWithContentScript(tabId, scripts[key])
                        .then(result => {
                            console.log('Injeção bem-sucedida:', result);
                        })
                        .catch(error => {
                            console.error('Método principal de injeção falhou:', error);
                            injectHelperScript(tabId)
                                .then(() => injectUserScript(tabId, scripts[key]))
                                .then(result => {
                                    console.log('Método alternativo 1 bem-sucedido:', result);
                                })
                                .catch(err => {
                                    console.error('Método alternativo 1 falhou:', err);
                                    fallbackInjection(tabId, scripts[key])
                                        .then(result => {
                                            console.log('Método alternativo 2 bem-sucedido:', result);
                                        })
                                        .catch(err2 => {
                                            console.error('Método alternativo 2 falhou:', err2);
                                            strictCSPFallback(tabId, scripts[key])
                                                .then(result => {
                                                    console.log('Método alternativo 3 (CSP strict) ' + (result ? 'bem-sucedido' : 'falhou'));
                                                })
                                                .catch(err3 => {
                                                    console.error('Método alternativo 3 falhou:', err3);
                                                    evalFallback(tabId, scripts[key])
                                                        .then(result => {
                                                            console.log('Método alternativo 4 (eval) ' + (result ? 'bem-sucedido' : 'falhou'));
                                                        })
                                                        .catch(finalError => {
                                                            console.error('Todos os métodos de injeção falharam:', finalError);
                                                        });
                                                });
                                        });
                                });
                        });

                    break;
                }
            }
        });
    } catch (error) {
        console.error('Erro ao processar URL:', error);
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        executeScriptIfMatch(tabId, tab);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'executeManualScript') {
        const { tabId, script } = message;

        const tryExecuteScript = async () => {
            try {
                await injectWithContentScript(tabId, script);
                return { success: true, method: 'content-script' };
            } catch (error) {
                console.warn('Método principal falhou, tentando método auxiliar:', error);

                try {
                    await injectHelperScript(tabId);
                    await injectUserScript(tabId, script);
                    return { success: true, method: 'helper' };
                } catch (err) {
                    console.warn('Método auxiliar falhou, tentando fallback:', err);

                    try {
                        await fallbackInjection(tabId, script);
                        return { success: true, method: 'fallback' };
                    } catch (err2) {
                        console.warn('Método fallback falhou, tentando CSP strict:', err2);

                        try {
                            const result = await strictCSPFallback(tabId, script);
                            return { success: result, method: 'csp-strict' };
                        } catch (err3) {
                            console.warn('Método CSP strict falhou, tentando eval fallback (último recurso):', err3);

                            try {
                                const result = await evalFallback(tabId, script);
                                return { success: result, method: 'eval-fallback' };
                            } catch (finalError) {
                                throw finalError;
                            }
                        }
                    }
                }
            }
        };

        tryExecuteScript()
            .then(result => {
                sendResponse({ success: result.success, result });
            })
            .catch(error => {
                console.error('Todos os métodos de injeção falharam:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true;
    }
});

async function injectWithContentScript(tabId, scriptInfo, executionTime) {
    const injectorUrl = chrome.runtime.getURL('injected-scripts/injector.js');
    const executorUrl = chrome.runtime.getURL('injected-scripts/executor.js');

    const scriptOptions = {
        target: { tabId: tabId },
        func: triggerInjection,
        args: [scriptInfo, injectorUrl, executorUrl],
        world: "MAIN"
    };


    return chrome.scripting.executeScript(scriptOptions);
}

async function triggerInjection(scriptInfo, injectorUrl, executorUrl) {
    try {
        const createScriptFileUrl = (code) => {
            const blob = new Blob([code], { type: 'application/javascript' });
            return URL.createObjectURL(blob);
        };

        const loadExecutorScript = () => {
            return new Promise((resolve, reject) => {
                const scriptId = 'js-injector-' + Date.now();

                const messageHandler = (event) => {
                    if (event.source !== window) return;

                    if (event.data && event.data.type === 'js-injector-ready' &&
                        event.data.id === scriptId) {
                        window.postMessage({
                            type: 'js-injector-execute',
                            id: scriptId,
                            name: scriptInfo.name || 'Script sem nome',
                            code: scriptInfo.code
                        }, '*');
                    }

                    if (event.data && event.data.type === 'js-injector-executed' &&
                        event.data.id === scriptId) {
                        window.removeEventListener('message', messageHandler);

                        if (event.data.success) {
                            resolve(true);
                        } else {
                            reject(new Error(event.data.error || 'Execução falhou'));
                        }
                    }
                };

                window.addEventListener('message', messageHandler);

                const script = document.createElement('script');
                script.src = `${executorUrl}?id=${scriptId}&t=${Date.now()}`;
                script.setAttribute('data-js-injector', 'executor');
                document.head.appendChild(script);

                setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('Tempo de execução esgotado'));
                }, 10000);
            });
        };

        try {
            await loadExecutorScript();
            return { success: true, method: 'executor' };
        } catch (executorError) {
            console.warn('Falha ao executar usando script executor:', executorError);

            const loadHelperScript = () => {
                return new Promise((resolve, reject) => {
                    if (window._JSInjector) {
                        resolve(true);
                        return;
                    }

                    const helperScript = document.createElement('script');
                    helperScript.onload = () => resolve(true);
                    helperScript.onerror = (e) => reject(new Error('Falha ao carregar script auxiliar: ' + e.message));
                    helperScript.src = injectorUrl;
                    document.head.appendChild(helperScript);
                });
            };

            try {
                await loadHelperScript();

                if (window._JSInjector && typeof window._JSInjector.injectScript === 'function') {
                    window._JSInjector.injectScript(scriptInfo.code, scriptInfo.name);
                    return { success: true, method: 'helper' };
                }
            } catch (helperError) {
                console.warn('Falha ao executar usando script auxiliar:', helperError);
            }

            const loadUserScript = () => {
                const userScriptUrl = createScriptFileUrl(`
          (function() {
            try {
              ${scriptInfo.code}
              console.log('%c[Code Injection] Script executado com sucesso', 'color: green; font-weight: bold;');
            } catch (error) {
              console.error('%c[Code Injection] Erro na execução do script:', 'color: red; font-weight: bold;', error);
            }
          })();
        `);

                const scriptElem = document.createElement('script');
                scriptElem.src = userScriptUrl;
                document.head.appendChild(scriptElem);

                setTimeout(() => URL.revokeObjectURL(userScriptUrl), 5000);
            };

            loadUserScript();
            return { success: true, method: 'direct-blob' };
        }
    } catch (error) {
        console.error('Falha na injeção:', error);
        return { success: false, error: error.message };
    }
}

async function injectHelperScript(tabId) {
    const injectorUrl = chrome.runtime.getURL('injected-scripts/injector.js');

    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (url) => {
            if (window._JSInjector) {
                return true;
            }

            const script = document.createElement('script');
            script.src = url;
            script.id = 'js-injector-loader';
            document.head.appendChild(script);

            return true;
        },
        args: [injectorUrl]
    });
}

async function injectUserScript(tabId, scriptInfo) {
    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (scriptData) => {
            const checkInterval = setInterval(() => {
                if (window._JSInjector) {
                    clearInterval(checkInterval);

                    window._JSInjector.injectScript(
                        scriptData.code,
                        scriptData.name
                    );
                }
            }, 50);

            setTimeout(() => clearInterval(checkInterval), 5000);

            return true;
        },
        args: [scriptInfo]
    });
}

async function fallbackInjection(tabId, scriptInfo) {
    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (code, name) => {
            try {
                const executeInPage = (codeToExecute, scriptName) => {
                    const wrappedCode = `
            (function() {
              try {
                ${codeToExecute}
                console.log('%c[Code Injection] "${scriptName}" executado com sucesso', 'color: green; font-weight: bold;');
              } catch(err) {
                console.error('%c[Code Injection] "${scriptName}" erro na execução:', 'color: red; font-weight: bold;', err);
              }
            })();
          `;

                    const blob = new Blob([wrappedCode], { type: 'application/javascript' });
                    const blobUrl = URL.createObjectURL(blob);

                    const script = document.createElement('script');
                    script.src = blobUrl;
                    script.setAttribute('data-js-injector', 'fallback');
                    script.setAttribute('data-script-name', scriptName);

                    document.head.appendChild(script);

                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

                    return true;
                };

                return executeInPage(code, name);
            } catch (error) {
                console.error('Método de injeção alternativo falhou:', error);
                return false;
            }
        },
        args: [scriptInfo.code, scriptInfo.name || 'Script sem nome']
    }).catch(error => {
        console.error('Execução do método de injeção alternativo falhou:', error);
    });
}

async function evalFallback(tabId, scriptInfo) {
    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (code, name) => {
            try {
                function executeSnippetCode(codeToExecute) {
                    try {
                        eval(codeToExecute);
                        console.log('%c[Code Injection] "' + name + '" executado com sucesso (eval fallback)', 'color: green; font-weight: bold;');
                        return true;
                    } catch (error) {
                        console.error('[Auto Snippets] Erro ao executar snippet:', error);
                        return false;
                    }
                }

                return executeSnippetCode(code);
            } catch (error) {
                console.error('Eval fallback falhou:', error);
                return false;
            }
        },
        args: [scriptInfo.code, scriptInfo.name || 'Script sem nome']
    }).catch(error => {
        console.error('Execução do eval fallback falhou:', error);
        return false;
    });
}

async function strictCSPFallback(tabId, scriptInfo) {
    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (code, name) => {
            try {
                const tryImportMethod = async () => {
                    try {
                        const moduleCode = `
              export default async function() {
                try {
                  ${code}
                  console.log('%c[Code Injection] "${name}" (método ES módulo) executado com sucesso', 'color: green; font-weight: bold;');
                  return true;
                } catch(err) {
                  console.error('%c[Code Injection] "${name}" (método ES módulo) erro na execução:', 'color: red; font-weight: bold;', err);
                  return false;
                }
              }
            `;

                        const blob = new Blob([moduleCode], { type: 'application/javascript' });
                        const moduleUrl = URL.createObjectURL(blob);

                        const module = await import(moduleUrl);

                        const result = await module.default();

                        setTimeout(() => URL.revokeObjectURL(moduleUrl), 1000);

                        return result;
                    } catch (error) {
                        console.warn('Falha na execução do método ES módulo:', error);
                        return false;
                    }
                };

                const tryWorkerMethod = async () => {
                    try {
                        const workerCode = `
              self.onmessage = function(e) {
                try {
                  eval(e.data.code);
                  self.postMessage({ success: true });
                } catch (error) {
                  self.postMessage({ success: false, error: error.message });
                }
              };
            `;

                        const blob = new Blob([workerCode], { type: 'application/javascript' });
                        const workerUrl = URL.createObjectURL(blob);

                        const worker = new Worker(workerUrl);

                        return new Promise((resolve) => {
                            worker.onmessage = function (e) {
                                if (e.data.success) {
                                    console.log('%c[Code Injection] "${name}" (método Worker) executado com sucesso', 'color: green; font-weight: bold;');
                                } else {
                                    console.error('%c[Code Injection] "${name}" (método Worker) erro na execução:', 'color: red; font-weight: bold;', e.data.error);
                                }

                                worker.terminate();
                                URL.revokeObjectURL(workerUrl);
                                resolve(e.data.success);
                            };

                            worker.postMessage({ code });

                            setTimeout(() => {
                                worker.terminate();
                                URL.revokeObjectURL(workerUrl);
                                resolve(false);
                            }, 5000);
                        });
                    } catch (error) {
                        console.warn('Falha na execução do método Worker:', error);
                        return false;
                    }
                };

                const tryIframeMethod = () => {
                    try {
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';

                        const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <script>
                  try {
                    ${code}
                    window.parent.postMessage({ type: 'js-injector-result', success: true }, '*');
                  } catch(err) {
                    console.error('Erro na execução:', err);
                    window.parent.postMessage({ 
                      type: 'js-injector-result', 
                      success: false, 
                      error: err.message 
                    }, '*');
                  }
                </script>
              </head>
              <body></body>
              </html>
            `;

                        const dataUrl = 'data:text/html;base64,' + btoa(htmlContent);

                        iframe.src = dataUrl;

                        return new Promise((resolve) => {
                            const messageHandler = (event) => {
                                if (event.data && event.data.type === 'js-injector-result') {
                                    window.removeEventListener('message', messageHandler);
                                    document.body.removeChild(iframe);

                                    if (event.data.success) {
                                        console.log('%c[Code Injection] "${name}" (método iframe) executado com sucesso', 'color: green; font-weight: bold;');
                                    } else {
                                        console.error('%c[Code Injection] "${name}" (método iframe) erro na execução:', 'color: red; font-weight: bold;',
                                            event.data.error);
                                    }

                                    resolve(event.data.success);
                                }
                            };

                            window.addEventListener('message', messageHandler);
                            document.body.appendChild(iframe);

                            setTimeout(() => {
                                window.removeEventListener('message', messageHandler);
                                if (document.body.contains(iframe)) {
                                    document.body.removeChild(iframe);
                                }
                                resolve(false);
                            }, 5000);
                        });
                    } catch (error) {
                        console.warn('Falha na execução do método iframe:', error);
                        return false;
                    }
                };

                return Promise.resolve()
                    .then(tryImportMethod)
                    .then(result => result ? result : tryWorkerMethod())
                    .then(result => result ? result : tryIframeMethod())
                    .catch(error => {
                        console.error('Todos os métodos compatíveis com CSP falharam:', error);
                        return false;
                    });
            } catch (error) {
                console.error('Injeção compatível com CSP estrito falhou:', error);
                return false;
            }
        },
        args: [scriptInfo.code, scriptInfo.name || 'Script sem nome']
    }).catch(error => {
        console.error('Execução da injeção compatível com CSP estrito falhou:', error);
    });
} 