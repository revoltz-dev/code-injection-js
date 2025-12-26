document.addEventListener('DOMContentLoaded', async function () {

  const currentDomainEl = document.getElementById('current-domain');
  const scriptStatusEl = document.getElementById('script-status');
  const addScriptBtn = document.getElementById('add-script');
  const editScriptBtn = document.getElementById('edit-script');
  const manageScriptsBtn = document.getElementById('manage-scripts');
  const optionsBtn = document.getElementById('options-header');
  const toggleInjectionSwitch = document.getElementById('toggle-injection');
  const toggleThemeBtn = document.getElementById('toggle-theme-header');
  const executeManualBtn = document.getElementById('execute-manual');
  const executionTimeSelect = document.getElementById('execution-time-select');
  const executionTimeContainer = document.getElementById('execution-time-container');

  const codeContainer = document.getElementById('code-container');
  const codeEditorDiv = document.getElementById('code-editor');
  const codeTitle = document.getElementById('code-title');
  const scriptNameInput = document.getElementById('script-name-input');
  const editNameBtn = document.getElementById('edit-name');
  const toggleEditBtn = document.getElementById('toggle-edit');
  const refreshPageBtn = document.getElementById('refresh-page');
  const codeStatus = document.getElementById('code-status');
  const saveScriptBtn = document.getElementById('save-script');
  const emptyState = document.getElementById('empty-state');
  const createScriptBtn = document.getElementById('create-script');
  const toastContainer = document.getElementById('toast-container');

  let currentDomain = '';
  let currentTabId = null;
  let currentTabUrl = '';
  let matchedScriptId = null;
  let currentScript = null;
  let isEditMode = true;
  let isEditingName = false;
  let isScriptEnabled = false;
  let isDarkMode = false;
  let editor = null;

  initTheme();

  toggleEditBtn.innerHTML = '<span>✓</span>';
  toggleEditBtn.title = 'Salvar Edição';

  if (codeStatus) {
    codeStatus.textContent = '';
  }

  function initTheme() {

    chrome.storage.local.get('darkMode', (data) => {

      if (data.darkMode === undefined) {
        isDarkMode = true;
        chrome.storage.local.set({ darkMode: true });
      } else {
        isDarkMode = data.darkMode === true;
      }
      applyTheme(isDarkMode);

      if (toggleThemeBtn) {
        toggleThemeBtn.innerHTML = isDarkMode ? '<span>☀️</span>' : '<span>🌙</span>';
        toggleThemeBtn.title = isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro';
      }
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
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (headerIcon) {
        headerIcon.src = 'images/code-injection[light].png';
      }
      if (editor) {
        editor.setOption('theme', 'default');
      }
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;

    applyTheme(isDarkMode);

    if (toggleThemeBtn) {
      toggleThemeBtn.innerHTML = isDarkMode ? '<span>☀️</span>' : '<span>🌙</span>';
      toggleThemeBtn.title = isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    }

    chrome.storage.local.set({ darkMode: isDarkMode });
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
    readOnly: false,
    lineWrapping: false,
    scrollbarStyle: 'native',
    viewportMargin: Infinity,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Tab': function (cm) {
        const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      }
    }
  });

  function updateStatusDisplay(isActive, statusText) {

    const statusIndicator = scriptStatusEl.querySelector('.status-indicator');

    const displayText = statusText.replace('Status: ', '');
    scriptStatusEl.textContent = displayText;
    scriptStatusEl.insertAdjacentElement('afterbegin', statusIndicator);

    if (isActive) {
      scriptStatusEl.classList.add('status-active');
      scriptStatusEl.classList.remove('status-inactive');
      isScriptEnabled = true;
      toggleInjectionSwitch.checked = true;
    } else {
      scriptStatusEl.classList.remove('status-active');
      scriptStatusEl.classList.add('status-inactive');
      isScriptEnabled = false;
      toggleInjectionSwitch.checked = false;
    }

    updateManualExecuteButton();
  }

  function updateManualExecuteButton() {
    if (currentScript && currentScript.executionTime === 'manual' && isScriptEnabled) {
      executeManualBtn.style.display = 'flex';
    } else {
      executeManualBtn.style.display = 'none';
    }
  }

  function setToggleSwitchState(enabled) {
    toggleInjectionSwitch.disabled = !enabled;
    const switchLabel = toggleInjectionSwitch.closest('.switch');
    if (switchLabel) {
      if (enabled) {
        switchLabel.removeAttribute('data-disabled');
      } else {
        switchLabel.setAttribute('data-disabled', 'true');
      }
    }
  }

  function showCode(script) {
    currentScript = script;
    codeContainer.classList.remove('hidden');
    codeTitle.textContent = script.name || 'Script sem nome';
    scriptNameInput.value = script.name || 'Script sem nome';
    editor.setValue(script.code || '');
    emptyState.classList.add('hidden');
    codeEditorDiv.style.display = '';
    editor.refresh();
    setEditMode(true);

    saveScriptBtn.classList.remove('hidden');

    if (executionTimeSelect) {
      const execTime = script.executionTime || 'automatic';
      executionTimeSelect.value = (execTime !== 'manual' && execTime !== 'automatic') ? 'automatic' : execTime;
    }

    if (executionTimeContainer) {
      executionTimeContainer.style.display = 'flex';
    }

    updateManualExecuteButton();
  }

  function showEmptyState() {
    currentScript = null;
    codeContainer.classList.remove('hidden');
    codeEditorDiv.style.display = 'none';
    emptyState.classList.remove('hidden');
    saveScriptBtn.classList.add('hidden');

    if (executionTimeContainer) {
      executionTimeContainer.style.display = 'none';
    }
  }

  function setEditMode(enabled) {
    isEditMode = enabled;
    editor.setOption('readOnly', !enabled);

    if (enabled) {
      codeStatus.textContent = '';
      toggleEditBtn.innerHTML = '<span>✓</span>';
      toggleEditBtn.title = 'Salvar Edição';
      saveScriptBtn.classList.remove('hidden');
    } else {
      codeStatus.textContent = 'Modo Somente Leitura';
      toggleEditBtn.innerHTML = '<span>✎</span>';
      toggleEditBtn.title = 'Alternar para Modo de Edição';
      saveScriptBtn.classList.add('hidden');
    }
  }

  function refreshPage() {
    if (!currentTabId) {
      showToast('Não é possível atualizar: Nenhuma aba disponível', 'error');
      return;
    }

    try {

      chrome.tabs.reload(currentTabId);
      showToast('Atualizando página...', 'info');

      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar página:', error);
      showToast('Falha ao atualizar: ' + error.message, 'error');
    }
  }

  function toggleEditName() {
    if (isEditingName) {
      const newName = scriptNameInput.value.trim();
      if (newName) {
        currentScript.name = newName;
        codeTitle.textContent = newName;

        saveScriptName(newName);
      }

      scriptNameInput.classList.add('hidden');
      codeTitle.classList.remove('hidden');
      editNameBtn.innerHTML = '<span>✏️</span>';
      isEditingName = false;
    } else {
      scriptNameInput.value = currentScript.name || 'Script sem nome';
      scriptNameInput.classList.remove('hidden');
      codeTitle.classList.add('hidden');
      scriptNameInput.focus();
      scriptNameInput.select();
      editNameBtn.innerHTML = '<span>✓</span>';
      isEditingName = true;
    }
  }

  async function saveScriptName(newName) {
    if (!currentScript || !matchedScriptId) return;

    try {
      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      const scripts = data.scripts || {};
      const disabledScripts = data._disabledScripts || {};

      let updated = false;

      if (scripts[matchedScriptId]) {
        scripts[matchedScriptId].name = newName;
        scripts[matchedScriptId].updatedAt = Date.now();
        updated = true;
      }

      if (disabledScripts[matchedScriptId]) {
        disabledScripts[matchedScriptId].name = newName;
        disabledScripts[matchedScriptId].updatedAt = Date.now();
        updated = true;
      }

      if (updated) {
        await chrome.storage.local.set({
          scripts: scripts,
          _disabledScripts: disabledScripts
        });

        showToast('Nome atualizado', 'success');
      } else {
        showToast('Script não encontrado', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar nome do script:', error);
      showToast('Falha ao atualizar nome: ' + error.message, 'error');
    }
  }

  async function saveScript() {
    if (!currentScript) return;

    try {
      if (isEditingName) {
        toggleEditName();
      }

      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      const scripts = data.scripts || {};
      const disabledScripts = data._disabledScripts || {};

      const isNewScript = matchedScriptId.startsWith('temp_');

      let existingScriptId = null;
      let existingScriptName = '';

      for (const id in scripts) {
        if (id !== matchedScriptId && scripts[id].domain === currentDomain) {
          existingScriptId = id;
          existingScriptName = scripts[id].name;
          break;
        }
      }

      if (!existingScriptId) {
        for (const id in disabledScripts) {
          if (id !== matchedScriptId && disabledScripts[id].domain === currentDomain) {
            existingScriptId = id;
            existingScriptName = disabledScripts[id].name;
            break;
          }
        }
      }

      if (existingScriptId) {
        const confirmed = confirm(
          `Já existe um script para o domínio "${currentDomain}" (${existingScriptName}). ` +
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

      const currentTime = Date.now();

      const executionTimeValue = executionTimeSelect ? (executionTimeSelect.value || 'automatic') : (currentScript.executionTime || 'automatic');

      const scriptData = {
        domain: currentDomain,
        name: currentScript.name,
        code: editor.getValue(),
        executionTime: executionTimeValue,
        createdAt: currentScript.createdAt || currentTime,
        updatedAt: currentTime
      };

      if (isNewScript) {

        const realId = 'script_' + currentTime;
        matchedScriptId = realId;

        if (isScriptEnabled) {
          scripts[realId] = scriptData;
        } else {
          disabledScripts[realId] = scriptData;
        }

        updateStatusDisplay(isScriptEnabled, isScriptEnabled ? 'Status: Injetado' : 'Status: Inativo');
        editScriptBtn.disabled = false;
      } else {

        const scriptInActive = scripts[matchedScriptId] !== undefined;
        const scriptInDisabled = disabledScripts[matchedScriptId] !== undefined;

        if (scriptInActive && scripts[matchedScriptId].createdAt) {
          scriptData.createdAt = scripts[matchedScriptId].createdAt;
        } else if (scriptInDisabled && disabledScripts[matchedScriptId].createdAt) {
          scriptData.createdAt = disabledScripts[matchedScriptId].createdAt;
        }

        if (isScriptEnabled) {

          if (scriptInDisabled) {

            delete disabledScripts[matchedScriptId];
          }
          scripts[matchedScriptId] = scriptData;
        } else {
          if (scriptInActive) {
            delete scripts[matchedScriptId];
          }
          disabledScripts[matchedScriptId] = scriptData;
        }
      }

      await chrome.storage.local.set({
        scripts: scripts,
        _disabledScripts: disabledScripts
      });

      currentScript = scriptData;

      if (executionTimeSelect) {
        executionTimeSelect.value = executionTimeValue;
      }

      updateManualExecuteButton();

      showToast('Salvo com sucesso', 'success');

    } catch (error) {
      console.error('Erro ao salvar script:', error);
      showToast('Falha ao salvar script: ' + error.message, 'error');
    }
  }

  async function toggleScriptEnabled(enabled) {
    isScriptEnabled = enabled;

    updateStatusDisplay(
      enabled,
      enabled ? 'Status: Injetado' : 'Status: Inativo'
    );

    if (!matchedScriptId || matchedScriptId.startsWith('temp_')) {
      return;
    }

    try {

      const data = await chrome.storage.local.get('scripts');
      const scripts = data.scripts || {};

      if (enabled) {

        const disabledData = await chrome.storage.local.get('_disabledScripts');
        const disabledScripts = disabledData._disabledScripts || {};

        if (disabledScripts[matchedScriptId]) {

          scripts[matchedScriptId] = disabledScripts[matchedScriptId];

          delete disabledScripts[matchedScriptId];

          await chrome.storage.local.set({
            'scripts': scripts,
            '_disabledScripts': disabledScripts
          });
        }
      } else {

        if (scripts[matchedScriptId]) {

          const disabledData = await chrome.storage.local.get('_disabledScripts');
          const disabledScripts = disabledData._disabledScripts || {};

          disabledScripts[matchedScriptId] = scripts[matchedScriptId];

          delete scripts[matchedScriptId];

          await chrome.storage.local.set({
            'scripts': scripts,
            '_disabledScripts': disabledScripts
          });
        }
      }

      refreshPage();
    } catch (error) {
      console.error('Erro ao atualizar status do script:', error);
      showToast('Falha ao atualizar status: ' + error.message, 'error');
    }
  }

  async function executeManualScript() {
    if (!currentScript || !currentTabId || !isScriptEnabled) {
      showToast('Não é possível executar o script', 'error');
      return;
    }

    if (currentScript.executionTime !== 'manual') {
      showToast('Este script não é manual', 'error');
      return;
    }

    try {
      const injectorUrl = chrome.runtime.getURL('injected-scripts/injector.js');
      const executorUrl = chrome.runtime.getURL('injected-scripts/executor.js');

      const result = await chrome.runtime.sendMessage({
        action: 'executeManualScript',
        tabId: currentTabId,
        script: currentScript
      });

      if (result && result.success) {
        showToast('Script executado com sucesso', 'success');
      } else {
        throw new Error(result?.error || 'Falha ao executar script');
      }
    } catch (error) {
      console.error('Erro ao executar script manual:', error);
      showToast('Falha ao executar script: ' + error.message, 'error');
    }
  }


  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    if (tabs.length === 0) {
      currentDomainEl.textContent = 'Nenhuma aba disponível';
      updateStatusDisplay(false, 'Erro ao carregar');
      disableSiteButtons(addScriptBtn, editScriptBtn);
      showEmptyState();
      return;
    }

    const currentTab = tabs[0];
    currentTabId = currentTab.id;
    currentTabUrl = currentTab.url;

    if (!currentTabUrl || !currentTabUrl.startsWith('http')) {
      currentDomainEl.textContent = 'Não é uma página web (apenas links http/https suportados)';
      updateStatusDisplay(false, 'Não é possível usar a função de injeção de script nesta página');
      disableSiteButtons(addScriptBtn, editScriptBtn);
      codeContainer.classList.add('hidden');
      emptyState.classList.add('hidden');
      return;
    }

    try {
      const url = new URL(currentTabUrl);
      currentDomain = url.hostname;
      currentDomainEl.textContent = currentDomain;

      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      const scripts = data.scripts || {};
      const disabledScripts = data._disabledScripts || {};

      let exactMatch = false;
      let foundInDisabled = false;

      Object.keys(scripts).forEach(id => {
        const script = scripts[id];
        const scriptDomain = script.domain;

        if (scriptDomain.startsWith('*.') && currentDomain.endsWith(scriptDomain.substring(1))) {
          if (!exactMatch) {
            matchedScriptId = id;
            isScriptEnabled = true;
          }
        }

        else if (scriptDomain === currentDomain) {
          matchedScriptId = id;
          isScriptEnabled = true;
          exactMatch = true;
        }
      });

      if (!matchedScriptId) {
        Object.keys(disabledScripts).forEach(id => {
          const script = disabledScripts[id];
          const scriptDomain = script.domain;

          if (scriptDomain.startsWith('*.') && currentDomain.endsWith(scriptDomain.substring(1))) {
            if (!exactMatch && !foundInDisabled) {
              matchedScriptId = id;
              isScriptEnabled = false;
              foundInDisabled = true;
            }
          }

          else if (scriptDomain === currentDomain) {
            matchedScriptId = id;
            isScriptEnabled = false;
            foundInDisabled = true;
            exactMatch = true;
          }
        });
      }

      if (matchedScriptId) {
        updateStatusDisplay(
          isScriptEnabled,
          isScriptEnabled ? 'Status: Injetado' : 'Status: Desabilitado'
        );
        editScriptBtn.disabled = false;
        addScriptBtn.disabled = false;
        setToggleSwitchState(true);

        const scriptToShow = isScriptEnabled ?
          scripts[matchedScriptId] :
          disabledScripts[matchedScriptId];

        showCode(scriptToShow);
      } else {
        updateStatusDisplay(false, 'Status: Não Injetado');
        editScriptBtn.disabled = true;
        addScriptBtn.disabled = false;
        setToggleSwitchState(false);
        showEmptyState();
      }

    } catch (error) {
      console.error('Erro ao processar aba atual:', error);
      currentDomainEl.textContent = 'Erro';
      updateStatusDisplay(false, 'Erro ao carregar');
      disableSiteButtons(addScriptBtn, editScriptBtn);
      showEmptyState();
    }
  });

  addScriptBtn.addEventListener('click', function () {
    chrome.tabs.create({ url: `editor.html?domain=${encodeURIComponent(currentDomain)}` });
  });

  editScriptBtn.addEventListener('click', function () {
    if (matchedScriptId) {
      chrome.tabs.create({ url: `editor.html?id=${matchedScriptId}` });
    }
  });

  manageScriptsBtn.addEventListener('click', function () {
    chrome.tabs.create({ url: 'manager.html' });
  });

  const headerIcon = document.getElementById('header-icon');
  if (headerIcon) {
    headerIcon.style.cursor = 'pointer';
    headerIcon.addEventListener('click', function () {
      chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    });
  }

  if (optionsBtn) {
    optionsBtn.addEventListener('click', function () {
      chrome.runtime.openOptionsPage();
    });
  }

  toggleInjectionSwitch.addEventListener('change', function () {
    toggleScriptEnabled(this.checked);
  });

  executeManualBtn.addEventListener('click', function () {
    executeManualScript();
  });

  if (executionTimeSelect) {
    executionTimeSelect.addEventListener('change', async function () {
      if (currentScript && matchedScriptId && !matchedScriptId.startsWith('temp_')) {
        try {
          const executionTimeValue = this.value;
          currentScript.executionTime = executionTimeValue;

          const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
          const scripts = data.scripts || {};
          const disabledScripts = data._disabledScripts || {};

          const scriptInActive = scripts[matchedScriptId] !== undefined;
          const scriptInDisabled = disabledScripts[matchedScriptId] !== undefined;

          const currentTime = Date.now();
          const scriptData = {
            ...currentScript,
            executionTime: executionTimeValue,
            updatedAt: currentTime
          };

          if (isScriptEnabled) {
            if (scriptInDisabled) {
              delete disabledScripts[matchedScriptId];
            }
            scripts[matchedScriptId] = scriptData;
          } else {
            if (scriptInActive) {
              delete scripts[matchedScriptId];
            }
            disabledScripts[matchedScriptId] = scriptData;
          }

          await chrome.storage.local.set({
            scripts: scripts,
            _disabledScripts: disabledScripts
          });

          updateManualExecuteButton();
          showToast('Tempo de execução atualizado', 'success');
        } catch (error) {
          console.error('Erro ao salvar tempo de execução:', error);
          showToast('Erro ao salvar: ' + error.message, 'error');
        }
      } else if (currentScript) {
        currentScript.executionTime = this.value;
        updateManualExecuteButton();
      }
    });
  }

  function createNewScript() {
    const currentTime = Date.now();

    currentScript = {
      domain: currentDomain,
      name: 'Script para ' + currentDomain,
      code: '// Escreva seu código JavaScript aqui\n\n\n\n\n\n\n\n\n',
      executionTime: 'automatic',
      enabled: true,
      createdAt: currentTime,
      updatedAt: currentTime
    };

    matchedScriptId = 'temp_' + currentTime;

    emptyState.classList.add('hidden');
    codeEditorDiv.style.display = '';
    codeTitle.textContent = currentScript.name;
    scriptNameInput.value = currentScript.name;
    editor.setValue(currentScript.code);
    editor.refresh();
    setEditMode(true);

    saveScriptBtn.classList.remove('hidden');

    if (executionTimeSelect) {
      executionTimeSelect.value = 'automatic';
    }

    if (executionTimeContainer) {
      executionTimeContainer.style.display = 'flex';
    }

    isScriptEnabled = true;
    updateStatusDisplay(true, 'Status: Injetado');
  }

  toggleEditBtn.addEventListener('click', function () {
    if (!currentScript) {
      createNewScript();
      return;
    }

    saveScript();
  });

  if (createScriptBtn) {
    createScriptBtn.addEventListener('click', function () {
      createNewScript();
    });
  }

  refreshPageBtn.addEventListener('click', function () {
    refreshPage();
  });

  saveScriptBtn.addEventListener('click', function () {
    saveScript();
  });

  editNameBtn.addEventListener('click', function () {
    if (!currentScript) return;
    toggleEditName();
  });

  scriptNameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      toggleEditName();
    }
  });

  function disableSiteButtons(addButton, editButton) {
    addButton.disabled = true;
    editButton.disabled = true;
    setToggleSwitchState(false);
  }

  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', function () {
      toggleTheme();
    });
  }

  function showToast(message, type = 'info', duration = 2000) {

    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => {
      if (t.classList.contains('show')) {
        t.classList.remove('show');
        setTimeout(() => {
          if (t.parentNode) t.parentNode.removeChild(t);
        }, 300);
      }
    });

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
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);

    return toast;
  }
});