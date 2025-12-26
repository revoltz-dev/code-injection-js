document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  const scriptsList = document.getElementById('scripts-list');
  const emptyState = document.getElementById('empty-state');
  const scriptsTable = document.getElementById('scripts-table');
  const addNewButton = document.getElementById('add-new');
  const searchInput = document.getElementById('search');

  let scripts = {};
  let disabledScripts = {};
  let filteredScripts = {};
  let scriptStatusMap = {};

  async function loadScripts() {
    try {
      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      scripts = data.scripts || {};
      disabledScripts = data._disabledScripts || {};

      const allScripts = { ...scripts, ...disabledScripts };

      scriptStatusMap = {};
      Object.keys(scripts).forEach(id => {
        scriptStatusMap[id] = true;
      });
      Object.keys(disabledScripts).forEach(id => {
        scriptStatusMap[id] = false;
      });

      filteredScripts = { ...allScripts };
      renderScriptsList();
    } catch (error) {
      console.error('Erro ao carregar scripts:', error);
      showError('Falha ao carregar scripts, tente novamente.');
    }
  }

  function renderScriptsList() {
    scriptsList.innerHTML = '';

    const scriptIds = Object.keys(filteredScripts);

    if (scriptIds.length === 0) {
      scriptsTable.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    scriptsTable.style.display = 'table';
    emptyState.style.display = 'none';

    scriptIds.sort((a, b) => filteredScripts[b].updatedAt - filteredScripts[a].updatedAt);

    scriptIds.forEach(id => {
      const script = filteredScripts[id];
      const isEnabled = scriptStatusMap[id] === true;
      const tr = document.createElement('tr');

      if (!isEnabled) {
        tr.classList.add('script-disabled');
      }
      const nameTd = document.createElement('td');
      nameTd.textContent = script.name;

      const domainTd = document.createElement('td');
      domainTd.textContent = script.domain;

      const statusTd = document.createElement('td');
      const statusSpan = document.createElement('span');
      statusSpan.className = `status-badge ${isEnabled ? 'status-enabled' : 'status-disabled'}`;
      statusSpan.textContent = isEnabled ? 'Ativo' : 'Inativo';
      statusTd.appendChild(statusSpan);

      const executionTimeTd = document.createElement('td');
      let executionTime = script.executionTime || 'automatic';
      if (executionTime !== 'manual' && executionTime !== 'automatic') {
        executionTime = 'automatic';
      }
      const executionTimeText = executionTime === 'manual' ? 'Manual' : 'Automático';
      executionTimeTd.textContent = executionTimeText;

      const createdAtTd = document.createElement('td');
      createdAtTd.textContent = formatDate(script.createdAt);

      const updatedAtTd = document.createElement('td');
      updatedAtTd.textContent = formatDate(script.updatedAt);

      const actionsTd = document.createElement('td');
      actionsTd.className = 'actions';

      const toggleButton = document.createElement('button');
      toggleButton.className = `small ${isEnabled ? 'toggle-disable' : 'toggle-enable'}`;
      toggleButton.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isEnabled ? `
              <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
              <circle cx="16" cy="12" r="3" fill="currentColor"></circle>
            ` : `
              <rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
              <circle cx="8" cy="12" r="3" fill="currentColor"></circle>
            `}
          </svg>
          <span>${isEnabled ? 'Desativar' : 'Ativar'}</span>
        </span>
      `;
      toggleButton.addEventListener('click', async () => {
        await toggleScriptStatus(id, isEnabled);
      });

      const editButton = document.createElement('button');
      editButton.className = 'small';
      editButton.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Editar</span>
        </span>
      `;
      editButton.addEventListener('click', () => {
        window.location.href = `editor.html?id=${id}`;
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'small danger';
      deleteButton.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span>Excluir</span>
        </span>
      `;
      deleteButton.addEventListener('click', async () => {
        if (confirm(`Tem certeza de que deseja excluir o script "${script.name}"?`)) {
          try {
            const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
            const currentScripts = data.scripts || {};
            const currentDisabledScripts = data._disabledScripts || {};

            if (currentScripts[id]) {
              delete currentScripts[id];
            }
            if (currentDisabledScripts[id]) {
              delete currentDisabledScripts[id];
            }

            await chrome.storage.local.set({
              scripts: currentScripts,
              _disabledScripts: currentDisabledScripts
            });

            loadScripts();
            showMessage('Script excluído com sucesso', 'info');
          } catch (error) {
            console.error('Erro ao excluir script:', error);
            showError('Falha ao excluir script, tente novamente.');
          }
        }
      });

      actionsTd.appendChild(editButton);
      actionsTd.appendChild(deleteButton);
      actionsTd.appendChild(toggleButton);

      tr.appendChild(nameTd);
      tr.appendChild(domainTd);
      tr.appendChild(statusTd);
      tr.appendChild(executionTimeTd);
      tr.appendChild(createdAtTd);
      tr.appendChild(updatedAtTd);
      tr.appendChild(actionsTd);

      scriptsList.appendChild(tr);
    });
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, scriptsTable);

    setTimeout(() => {
      errorDiv.style.opacity = '0';
      setTimeout(() => errorDiv.remove(), 500);
    }, 3000);
  }

  function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `error-message ${type === 'info' ? 'info-message' : ''}`;
    messageDiv.textContent = message;
    messageDiv.style.backgroundColor = type === 'info' ? '#4285f4' : '#ea4335';
    document.body.insertBefore(messageDiv, scriptsTable);

    setTimeout(() => {
      messageDiv.style.opacity = '0';
      setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  async function toggleScriptStatus(scriptId, isCurrentlyEnabled) {
    try {
      const data = await chrome.storage.local.get(['scripts', '_disabledScripts']);
      const currentScripts = data.scripts || {};
      const currentDisabledScripts = data._disabledScripts || {};

      if (isCurrentlyEnabled) {
        if (currentScripts[scriptId]) {
          currentDisabledScripts[scriptId] = currentScripts[scriptId];
          delete currentScripts[scriptId];
        }
      } else {
        if (currentDisabledScripts[scriptId]) {
          currentScripts[scriptId] = currentDisabledScripts[scriptId];
          delete currentDisabledScripts[scriptId];
        }
      }

      await chrome.storage.local.set({
        scripts: currentScripts,
        _disabledScripts: currentDisabledScripts
      });

      showMessage(
        isCurrentlyEnabled
          ? 'Script desativado com sucesso'
          : 'Script ativado com sucesso',
        'info'
      );

      loadScripts();
    } catch (error) {
      console.error('Erro ao alterar status do script:', error);
      showError('Falha ao alterar status do script, tente novamente.');
    }
  }

  function searchScripts(query) {
    query = query.toLowerCase();

    if (!query) {
      filteredScripts = { ...scripts, ...disabledScripts };
    } else {
      filteredScripts = {};

      for (const id in scripts) {
        const script = scripts[id];
        if (
          script.name.toLowerCase().includes(query) ||
          script.domain.toLowerCase().includes(query)
        ) {
          filteredScripts[id] = script;
        }
      }

      for (const id in disabledScripts) {
        const script = disabledScripts[id];
        if (
          script.name.toLowerCase().includes(query) ||
          script.domain.toLowerCase().includes(query)
        ) {
          filteredScripts[id] = script;
        }
      }
    }

    renderScriptsList();
  }

  addNewButton.addEventListener('click', () => {
    window.location.href = 'editor.html';
  });

  searchInput.addEventListener('input', () => {
    searchScripts(searchInput.value);
  });

  function initTheme() {
    chrome.storage.local.get('darkMode', (data) => {
      let isDarkMode;
      if (data.darkMode === undefined) {
        isDarkMode = true;
        chrome.storage.local.set({ darkMode: true });
      } else {
        isDarkMode = data.darkMode === true;
      }
      applyTheme(isDarkMode);

      const themeToggleBtn = document.getElementById('toggle-theme-header');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = isDarkMode ? '<span>☀️</span>' : '<span>🌙</span>';
        themeToggleBtn.title = isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro';
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
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (headerIcon) {
        headerIcon.src = 'images/code-injection[light].png';
      }
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const isDarkMode = currentTheme === 'dark';
    const newIsDarkMode = !isDarkMode;

    applyTheme(newIsDarkMode);

    const themeToggleBtn = document.getElementById('toggle-theme-header');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = newIsDarkMode ? '<span>☀️</span>' : '<span>🌙</span>';
      themeToggleBtn.title = newIsDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro';
    }

    chrome.storage.local.set({ darkMode: newIsDarkMode });
  }

  const optionsBtn = document.getElementById('options-header');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', function () {
      chrome.runtime.openOptionsPage();
    });
  }

  const themeToggleBtn = document.getElementById('toggle-theme-header');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  loadScripts();
}); 