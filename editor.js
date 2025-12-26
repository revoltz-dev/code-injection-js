document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain') || '';
  const scriptId = urlParams.get('id') || '';
  const domainInput = document.getElementById('domain');
  const nameInput = document.getElementById('name');
  const executionTimeSelect = document.getElementById('execution-time');
  const codeTextarea = document.getElementById('code');
  const codeEditorDiv = document.getElementById('code-editor');
  const saveButton = document.getElementById('save');
  const returnButton = document.getElementById('return');
  const cancelButton = document.getElementById('cancel');
  const deleteButton = document.getElementById('delete');
  const formatCodeButton = document.getElementById('format-code');
  const toggleAutocompleteButton = document.getElementById('toggle-autocomplete');
  const toggleThemeButton = document.getElementById('toggle-theme');
  const toastContainer = document.getElementById('toast-container');

  let isDarkMode = false;
  let editor = null;

  await initTheme();

  async function initTheme() {
    return new Promise((resolve) => {
      chrome.storage.local.get('darkMode', (data) => {
        if (data.darkMode === undefined) {
          isDarkMode = true;
          chrome.storage.local.set({ darkMode: true });
        } else {
          isDarkMode = data.darkMode === true;
        }
        resolve();
      });
    });
  }

  function applyTheme(isDark) {
    const headerIcon = document.getElementById('header-icon');

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (headerIcon) {
        headerIcon.src = 'images/code-injection[dark].png';
      }
      if (editor) {
        editor.setOption('theme', 'monokai');
      }
      currentTheme = 'monokai';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (headerIcon) {
        headerIcon.src = 'images/code-injection[light].png';
      }
      if (editor) {
        editor.setOption('theme', 'default');
      }
      currentTheme = 'default';
    }
  }

  editor = CodeMirror(codeEditorDiv, {
    value: '',
    mode: 'javascript',
    theme: isDarkMode ? 'monokai' : 'default',
    lineNumbers: true,
    tabSize: 2,
    indentWithTabs: false,
    indentUnit: 2,
    matchBrackets: true,
    autoCloseBrackets: true,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Tab': function (cm) {
        const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      }
    }
  });

  let autocompleteEnabled = true;
  let currentTheme = isDarkMode ? 'monokai' : 'default';

  applyTheme(isDarkMode);

  function updateThemeHeaderButton(isDarkMode) {
    const themeToggleBtn = document.getElementById('toggle-theme-header');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isDarkMode ? '<span>☀️</span>' : '<span>🌙</span>';
      themeToggleBtn.title = isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    chrome.storage.local.set({ darkMode: isDarkMode });
    applyTheme(isDarkMode);
    updateThemeHeaderButton(isDarkMode);
  }

  toggleThemeButton.addEventListener('click', toggleTheme);

  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, duration);

    return toast;
  }

  function showConfirmToast(message) {
    return new Promise((resolve) => {
      const toast = document.createElement('div');
      toast.className = 'toast toast-warning';
      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.style.marginBottom = '10px';
      toast.appendChild(messageEl);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginTop = '10px';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'center';
      buttonContainer.style.gap = '10px';

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Confirmar';
      confirmBtn.style.padding = '5px 10px';
      confirmBtn.style.border = 'none';
      confirmBtn.style.borderRadius = '3px';
      confirmBtn.style.backgroundColor = '#4caf50';
      confirmBtn.style.color = 'white';
      confirmBtn.style.cursor = 'pointer';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.style.padding = '5px 10px';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '3px';
      cancelBtn.style.backgroundColor = '#f44336';
      cancelBtn.style.color = 'white';
      cancelBtn.style.cursor = 'pointer';

      buttonContainer.appendChild(confirmBtn);
      buttonContainer.appendChild(cancelBtn);
      toast.appendChild(buttonContainer);
      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      confirmBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
          toastContainer.removeChild(toast);
          resolve(true);
        }, 300);
      });

      cancelBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
          toastContainer.removeChild(toast);
          resolve(false);
        }, 300);
      });
    });
  }

  async function checkUnsavedChanges() {
    const originalData = await chrome.storage.local.get('scripts');
    const scripts = originalData.scripts || {};

    if (scriptId && scripts[scriptId] && !scripts[scriptId].unsaved) {
      const originalScript = scripts[scriptId];
      const hasChanges =
        domainInput.value !== originalScript.domain ||
        nameInput.value !== originalScript.name ||
        editor.getValue() !== originalScript.code;

      if (hasChanges) {
        scripts[scriptId].unsaved = true;
        await chrome.storage.local.set({ scripts });
      }
    }
  }

  function formatJSCode(code) {
    try {
      let formatted = code.replace(/\n{3,}/g, '\n\n');
      const lines = formatted.split('\n');
      let indentLevel = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.match(/[{[]$/)) {
          lines[i] = '  '.repeat(indentLevel) + line;
          indentLevel++;
        } else if (line.match(/^[}\]]/)) {
          indentLevel = Math.max(0, indentLevel - 1);
          lines[i] = '  '.repeat(indentLevel) + line;
        } else {
          lines[i] = '  '.repeat(indentLevel) + line;
        }

        if (line.match(/^[^}\]]*[}\]]+/)) {
          const rightBraces = (line.match(/[}\]]/g) || []).length;
          const leftBraces = (line.match(/[{[]/g) || []).length;

          if (rightBraces > leftBraces) {
            indentLevel = Math.max(0, indentLevel - (rightBraces - leftBraces));
          }
        }
      }

      return lines.join('\n');
    } catch (e) {
      console.error('Erro ao formatar código:', e);
      showToast('Erro ao formatar código', 'error');
      return code;
    }
  }
  formatCodeButton.addEventListener('click', () => {
    const currentCode = editor.getValue();
    const formattedCode = formatJSCode(currentCode);
    editor.setValue(formattedCode);
    showToast('Código formatado com sucesso', 'success');
  });

  function toggleAutocomplete() {
    autocompleteEnabled = !autocompleteEnabled;

    const extraKeys = autocompleteEnabled
      ? {
        'Ctrl-Space': 'autocomplete',
        'Tab': function (cm) {
          const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
          cm.replaceSelection(spaces);
        }
      }
      : {
        'Tab': function (cm) {
          const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
          cm.replaceSelection(spaces);
        }
      };

    editor.setOption('extraKeys', extraKeys);
    updateAutocompleteButtonText();

    showToast(
      autocompleteEnabled
        ? 'Autocompletar habilitado'
        : 'Autocompletar desabilitado',
      'info'
    );
  }

  function updateAutocompleteButtonText() {
    const autoCompleteTextSpan = toggleAutocompleteButton.querySelector('span:last-child');
    if (autoCompleteTextSpan) {
      autoCompleteTextSpan.textContent = autocompleteEnabled
        ? 'Autocompletar: Ligado'
        : 'Autocompletar: Desligado';
    }
  }

  toggleAutocompleteButton.addEventListener('click', toggleAutocomplete);

  saveButton.addEventListener('click', async () => {
    const domainValue = domainInput.value.trim();
    const nameValue = nameInput.value.trim();
    const executionTimeValue = executionTimeSelect.value || 'automatic';
    const codeValue = editor.getValue();

    if (!domainValue) {
      showToast('O domínio do site é obrigatório', 'error');
      domainInput.focus();
      return;
    }

    if (!nameValue) {
      showToast('O nome do script é obrigatório', 'error');
      nameInput.focus();
      return;
    }

    if (!codeValue) {
      showToast('O código JavaScript é obrigatório', 'error');
      editor.focus();
      return;
    }

    try {
      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      const scripts = data.scripts || {};
      const disabledScripts = data._disabledScripts || {};
      let existingScriptId = null;
      let existingScriptName = '';

      for (const id in scripts) {
        if (id !== scriptId && scripts[id].domain === domainValue) {
          existingScriptId = id;
          existingScriptName = scripts[id].name;
          break;
        }
      }

      if (!existingScriptId) {
        for (const id in disabledScripts) {
          if (id !== scriptId && disabledScripts[id].domain === domainValue) {
            existingScriptId = id;
            existingScriptName = disabledScripts[id].name;
            break;
          }
        }
      }

      if (existingScriptId) {
        const confirmed = await showConfirmToast(
          `Já existe um script para o domínio "${domainValue}" (${existingScriptName}). ` +
          `Deseja substituir o script existente?`
        );

        if (!confirmed) {
          return;
        }

        if (scripts[existingScriptId]) {
          delete scripts[existingScriptId];
        }
        if (disabledScripts[existingScriptId]) {
          delete disabledScripts[existingScriptId];
        }
      }

      const now = Date.now();

      if (scriptId) {
        const script = scripts[scriptId] || disabledScripts[scriptId];
        if (script) {
          if (disabledScripts[scriptId]) {
            delete disabledScripts[scriptId];
          }

          script.domain = domainValue;
          script.name = nameValue;
          script.code = codeValue;
          script.executionTime = executionTimeValue;
          script.updatedAt = now;
          delete script.unsaved;
          scripts[scriptId] = script;
        }
      } else {
        const newId = 'script_' + now;

        scripts[newId] = {
          domain: domainValue,
          name: nameValue,
          code: codeValue,
          executionTime: executionTimeValue,
          createdAt: now,
          updatedAt: now
        };
      }

      await chrome.storage.local.set({
        scripts: scripts,
        _disabledScripts: disabledScripts
      });

      showToast('Script salvo com sucesso!', 'success');

      setTimeout(() => {
        window.location.href = 'manager.html';
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar script:', error);
      showToast('Erro ao salvar script: ' + error.message, 'error');
    }
  });

  cancelButton.addEventListener('click', async () => {
    if (scriptId) {
      const data = await chrome.storage.local.get('scripts');
      const scripts = data.scripts || {};
      const script = scripts[scriptId];

      if (script && script.unsaved) {
        const confirmed = await showConfirmToast('Você tem alterações não salvas. Tem certeza de que deseja sair?');
        if (!confirmed) return;

        delete script.unsaved;
        await chrome.storage.local.set({ scripts });
      }
    }

    window.location.href = 'manager.html';
  });

  returnButton.addEventListener('click', async () => {
    if (scriptId) {
      const data = await chrome.storage.local.get('scripts');
      const scripts = data.scripts || {};
      const script = scripts[scriptId];

      if (script && script.unsaved) {
        const confirmed = await showConfirmToast('Você tem alterações não salvas. Tem certeza de que deseja sair?');
        if (!confirmed) return;

        delete script.unsaved;
        await chrome.storage.local.set({ scripts });
      }
    }

    window.location.href = 'manager.html';
  });

  deleteButton.addEventListener('click', async () => {
    const confirmed = await showConfirmToast('Tem certeza de que deseja excluir este script? Esta ação não pode ser desfeita.');

    if (confirmed) {
      try {
        const data = await chrome.storage.local.get('scripts');
        const scripts = data.scripts || {};

        if (scripts[scriptId]) {
          delete scripts[scriptId];
          await chrome.storage.local.set({ scripts });

          showToast('Script excluído com sucesso', 'success');

          setTimeout(() => {
            window.location.href = 'manager.html';
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao excluir script:', error);
        showToast('Erro ao excluir script: ' + error.message, 'error');
      }
    }
  });

  if (domain) {
    domainInput.value = domain;
  }

  if (scriptId) {
    try {
      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      const scripts = data.scripts || {};
      const disabledScripts = data._disabledScripts || {};
      const script = scripts[scriptId] || disabledScripts[scriptId];

      if (script) {
        domainInput.value = script.domain;
        nameInput.value = script.name;
        const execTime = script.executionTime || 'automatic';
        executionTimeSelect.value = (execTime !== 'manual' && execTime !== 'automatic') ? 'automatic' : execTime;
        editor.setValue(script.code || '');
        deleteButton.style.display = 'flex';
      }
    } catch (error) {
      console.error('Erro ao carregar script:', error);
      showToast('Erro ao carregar script: ' + error.message, 'error');
    }
  }

  domainInput.addEventListener('input', checkUnsavedChanges);
  nameInput.addEventListener('input', checkUnsavedChanges);
  editor.on('change', checkUnsavedChanges);

  updateAutocompleteButtonText();

  const headerIcon = document.getElementById('header-icon');
  if (headerIcon) {
    headerIcon.style.cursor = 'pointer';
    headerIcon.addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    });
  }

  const backBtn = document.getElementById('back-header');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    });
  }

  const themeToggleBtn = document.getElementById('toggle-theme-header');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      toggleTheme();
    });
  }

  updateThemeHeaderButton(isDarkMode);
});